import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Call, CallDocument } from '../calls/schemas/call.schema';
import { PatientsService } from '../patients/patients.service';
import { PatientCallContext, STREAK_MILESTONES } from './types/prompt-context.types';

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(
    @InjectModel(Call.name) private callModel: Model<CallDocument>,
    private patientsService: PatientsService,
  ) {}

  async buildContext(patientId: string): Promise<PatientCallContext> {
    const patient = await this.patientsService.findById(patientId);

    const now = new Date();

    // IST offset: UTC+5:30 = 330 minutes
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    // Yesterday boundaries in IST (server runs UTC on Cloud Run)
    // Compute IST midnight, then convert back to UTC for DB queries
    const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
    const yesterdayIST = new Date(nowIST);
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);

    const yesterdayStartIST = new Date(yesterdayIST);
    yesterdayStartIST.setUTCHours(0, 0, 0, 0);
    const yesterdayStart = new Date(yesterdayStartIST.getTime() - IST_OFFSET_MS);

    const yesterdayEndIST = new Date(yesterdayIST);
    yesterdayEndIST.setUTCHours(23, 59, 59, 999);
    const yesterdayEnd = new Date(yesterdayEndIST.getTime() - IST_OFFSET_MS);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Single aggregation with $facet for all context data
    const [results] = await this.callModel.aggregate([
      {
        $match: {
          patientId: new Types.ObjectId(patientId),
          scheduledAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $facet: {
          // Yesterday's completed calls (could be 1 or 2 per day)
          yesterdayCalls: [
            {
              $match: {
                scheduledAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                status: 'completed',
              },
            },
            { $sort: { scheduledAt: -1 } },
          ],
          // Last 5 completed calls for mood trend and recent complaints
          recentCompleted: [
            { $match: { status: 'completed' } },
            { $sort: { scheduledAt: -1 } },
            { $limit: 5 },
          ],
          // All completed calls in 14 days for adherence calculation
          fourteenDayCompleted: [
            { $match: { status: 'completed' } },
          ],
          // Missed calls in last 7 days
          recentMissed: [
            {
              $match: {
                scheduledAt: { $gte: sevenDaysAgo },
                status: { $in: ['no_answer', 'busy', 'declined'] },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    // Process yesterday's calls (aggregate across all calls that day)
    const yesterdayCalls = results?.yesterdayCalls || [];
    let yesterdayMood: string | null = null;
    const yesterdayComplaints: string[] = [];
    let yesterdayMedicinesTaken = 0;
    let yesterdayMedicinesTotal = 0;

    for (const call of yesterdayCalls) {
      // Use the most recent mood
      if (!yesterdayMood && call.moodNotes) {
        yesterdayMood = call.moodNotes;
      }
      // Collect all complaints
      if (call.complaints?.length) {
        yesterdayComplaints.push(...call.complaints);
      }
      // Sum up medicine adherence across all calls
      if (call.medicinesChecked?.length) {
        yesterdayMedicinesTotal += call.medicinesChecked.length;
        yesterdayMedicinesTaken += call.medicinesChecked.filter(
          (m: any) => m.response === 'taken',
        ).length;
      }
    }

    // Recent mood trend (last 5 calls)
    const recentCompleted = results?.recentCompleted || [];
    const recentMoods = recentCompleted
      .map((c: any) => c.moodNotes)
      .filter(Boolean);

    // Recent complaints (deduplicated)
    const allComplaints: string[] = recentCompleted
      .flatMap((c: any) => (c.complaints || []) as string[])
      .filter(Boolean);
    const recentComplaints: string[] = [...new Set(allComplaints)];

    // 14-day adherence percentage
    const fourteenDayCompleted = results?.fourteenDayCompleted || [];
    let totalMeds14Day = 0;
    let takenMeds14Day = 0;
    for (const call of fourteenDayCompleted) {
      if (call.medicinesChecked?.length) {
        totalMeds14Day += call.medicinesChecked.length;
        takenMeds14Day += call.medicinesChecked.filter(
          (m: any) => m.response === 'taken',
        ).length;
      }
    }
    const adherence14Day =
      totalMeds14Day > 0
        ? Math.round((takenMeds14Day / totalMeds14Day) * 100)
        : 0;

    // Missed calls count
    const recentMissedCalls = results?.recentMissed?.[0]?.count || 0;

    // Streak milestone detection
    const currentStreak = patient.currentStreak || 0;
    const lastMilestone = patient.lastStreakMilestone || 0;
    let isStreakMilestone = false;
    let streakMilestoneValue: number | null = null;

    for (const milestone of STREAK_MILESTONES) {
      if (currentStreak >= milestone && lastMilestone < milestone) {
        isStreakMilestone = true;
        streakMilestoneValue = milestone;
        // Keep checking for higher milestones (e.g., if streak jumped from 5 to 15)
      }
    }

    return {
      yesterdayMood,
      yesterdayComplaints: [...new Set(yesterdayComplaints)],
      yesterdayMedicinesTaken,
      yesterdayMedicinesTotal,
      currentStreak,
      adherence14Day,
      isStreakMilestone,
      streakMilestoneValue,
      recentMoods,
      recentComplaints,
      callsCompletedCount: patient.callsCompletedCount || 0,
      recentMissedCalls,
      fatigueScore: patient.fatigueScore || 0,
      patientName: patient.preferredName,
      isNewPatient: patient.isNewPatient,
      preferredLanguage: patient.preferredLanguage || 'hi',
      healthConditions: patient.healthConditions || [],
    };
  }
}
