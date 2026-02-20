import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { Call, CallDocument } from '../calls/schemas/call.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Subscription, SubscriptionDocument } from '../subscriptions/schemas/subscription.schema';
import { Medicine, MedicineDocument } from '../medicines/schemas/medicine.schema';
import { DateTime } from 'luxon';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Call.name) private callModel: Model<CallDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Medicine.name) private medicineModel: Model<MedicineDocument>,
  ) {}

  async getOverview() {
    const now = DateTime.now().setZone('Asia/Kolkata');
    const startOfDay = now.startOf('day').toJSDate();
    const endOfDay = now.endOf('day').toJSDate();

    const [
      totalPatients,
      activePatients,
      pausedPatients,
      trialPatients,
      todayCalls,
      subscriptionStats,
    ] = await Promise.all([
      this.patientModel.countDocuments(),
      this.patientModel.countDocuments({ isPaused: false }),
      this.patientModel.countDocuments({ isPaused: true }),
      this.patientModel.countDocuments({ subscriptionStatus: 'trial' }),
      this.callModel.find({
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      this.subscriptionModel.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, mrr: { $sum: '$planPrice' } } },
      ]),
    ]);

    const completedCalls = todayCalls.filter(c => c.status === 'completed').length;
    const failedCalls = todayCalls.filter(c => ['no_answer', 'busy', 'failed', 'declined'].includes(c.status)).length;
    const inProgressCalls = todayCalls.filter(c => ['scheduled', 'in_progress'].includes(c.status)).length;

    // Complaints & critical misses today
    let complaintsToday = 0;
    let criticalMissesToday = 0;
    let totalAdherence = 0;
    let patientsWithData = 0;

    for (const call of todayCalls) {
      if (call.status !== 'completed') continue;
      const validComplaints = (call.complaints || []).filter((c: string) => c && c !== 'none');
      complaintsToday += validComplaints.length;

      for (const med of call.medicinesChecked || []) {
        if (med.isCritical && med.response === 'missed') criticalMissesToday++;
      }

      const meds = call.medicinesChecked || [];
      if (meds.length > 0) {
        const taken = meds.filter((m: any) => m.response === 'taken').length;
        totalAdherence += Math.round((taken / meds.length) * 100);
        patientsWithData++;
      }
    }

    const avgAdherenceToday = patientsWithData > 0 ? Math.round(totalAdherence / patientsWithData) : 0;
    const mrr = subscriptionStats[0]?.mrr || 0;

    return {
      totalPatients,
      activePatients,
      pausedPatients,
      trialPatients,
      callsToday: {
        total: todayCalls.length,
        completed: completedCalls,
        failed: failedCalls,
        pending: inProgressCalls,
      },
      avgAdherenceToday,
      complaintsToday,
      criticalMissesToday,
      mrr,
    };
  }

  async getPatients(query: {
    search?: string;
    status?: string;
    subscription?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, subscription, sort = '-createdAt', page = 1, limit = 50 } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { preferredName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isPaused = false;
    if (status === 'paused') filter.isPaused = true;
    if (subscription) filter.subscriptionStatus = subscription;

    const sortObj: any = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [patients, total] = await Promise.all([
      this.patientModel
        .find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.patientModel.countDocuments(filter),
    ]);

    // Enrich with payer info and today's adherence
    const now = DateTime.now().setZone('Asia/Kolkata');
    const startOfDay = now.startOf('day').toJSDate();
    const endOfDay = now.endOf('day').toJSDate();

    const enriched = await Promise.all(
      patients.map(async (patient: any) => {
        const [payer, todayCalls] = await Promise.all([
          this.userModel.findById(patient.userId).select('name email phone').lean(),
          this.callModel.find({
            patientId: patient._id,
            scheduledAt: { $gte: startOfDay, $lte: endOfDay },
            status: 'completed',
          }).lean(),
        ]);

        let adherenceToday = -1;
        let complaintsToday: string[] = [];
        if (todayCalls.length > 0) {
          let taken = 0;
          let total = 0;
          for (const call of todayCalls) {
            for (const med of call.medicinesChecked || []) {
              total++;
              if (med.response === 'taken') taken++;
            }
            const valid = (call.complaints || []).filter((c: string) => c && c !== 'none');
            complaintsToday.push(...valid);
          }
          adherenceToday = total > 0 ? Math.round((taken / total) * 100) : -1;
        }

        return {
          ...patient,
          payer: payer || null,
          adherenceToday,
          complaintsToday,
        };
      }),
    );

    return { patients: enriched, total, page, pageSize: limit };
  }

  async getAlerts() {
    const now = DateTime.now().setZone('Asia/Kolkata');
    const startOfDay = now.startOf('day').toJSDate();
    const endOfDay = now.endOf('day').toJSDate();

    const todayCalls = await this.callModel
      .find({ scheduledAt: { $gte: startOfDay, $lte: endOfDay } })
      .populate('patientId', 'fullName preferredName phone')
      .lean();

    const alerts: any[] = [];

    for (const call of todayCalls) {
      const patient = call.patientId as any;
      if (!patient?._id) continue;

      // Complaints
      const complaints = (call.complaints || []).filter((c: string) => c && c !== 'none');
      if (complaints.length > 0) {
        alerts.push({
          type: 'complaint',
          severity: 'critical',
          patientId: patient._id,
          patientName: patient.preferredName || patient.fullName,
          message: `Complaints: ${complaints.join(', ')}`,
          callId: call._id,
          timestamp: call.scheduledAt,
        });
      }

      // Critical medicine misses
      for (const med of call.medicinesChecked || []) {
        if (med.isCritical && med.response === 'missed') {
          alerts.push({
            type: 'missed_critical',
            severity: 'critical',
            patientId: patient._id,
            patientName: patient.preferredName || patient.fullName,
            message: `Critical medicine missed: ${med.medicineName}`,
            callId: call._id,
            timestamp: call.scheduledAt,
          });
        }
      }

      // Low adherence
      if (call.status === 'completed') {
        const meds = call.medicinesChecked || [];
        if (meds.length > 0) {
          const taken = meds.filter((m: any) => m.response === 'taken').length;
          const pct = Math.round((taken / meds.length) * 100);
          if (pct < 50) {
            alerts.push({
              type: 'low_adherence',
              severity: 'warning',
              patientId: patient._id,
              patientName: patient.preferredName || patient.fullName,
              message: `Low adherence: ${pct}% (${taken}/${meds.length} medicines)`,
              callId: call._id,
              timestamp: call.scheduledAt,
            });
          }
        }
      }

      // Failed calls
      if (['failed', 'no_answer', 'busy', 'declined'].includes(call.status)) {
        alerts.push({
          type: 'call_failed',
          severity: 'info',
          patientId: patient._id,
          patientName: patient.preferredName || patient.fullName,
          message: `Call ${call.status.replace('_', ' ')}`,
          callId: call._id,
          timestamp: call.scheduledAt,
        });
      }

      // Abnormal vitals
      if (call.vitals?.glucose && (call.vitals.glucose > 200 || call.vitals.glucose < 70)) {
        alerts.push({
          type: 'vitals_alert',
          severity: 'critical',
          patientId: patient._id,
          patientName: patient.preferredName || patient.fullName,
          message: `Abnormal glucose: ${call.vitals.glucose} mg/dL`,
          callId: call._id,
          timestamp: call.scheduledAt,
        });
      }
      if (call.vitals?.bloodPressure?.systolic && (call.vitals.bloodPressure.systolic > 140 || call.vitals.bloodPressure.diastolic > 90)) {
        alerts.push({
          type: 'vitals_alert',
          severity: 'critical',
          patientId: patient._id,
          patientName: patient.preferredName || patient.fullName,
          message: `High BP: ${call.vitals.bloodPressure.systolic}/${call.vitals.bloodPressure.diastolic}`,
          callId: call._id,
          timestamp: call.scheduledAt,
        });
      }
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return alerts;
  }

  async getHealthAnalytics(days: number = 30) {
    const now = DateTime.now().setZone('Asia/Kolkata');
    const startDate = now.minus({ days }).startOf('day').toJSDate();
    const endDate = now.endOf('day').toJSDate();

    const [calls, patients] = await Promise.all([
      this.callModel.find({
        scheduledAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
      }).lean(),
      this.patientModel.find({ isPaused: false }).lean(),
    ]);

    // Adherence distribution: per-patient average adherence over the period
    const patientAdherence = new Map<string, { taken: number; total: number }>();
    const complaintsMap = new Map<string, number>();
    let criticalMisses = 0;
    const moodCounts = { good: 0, okay: 0, not_well: 0, unknown: 0 };
    const dailyComplaints = new Map<string, number>();

    for (const call of calls) {
      const pid = call.patientId.toString();
      if (!patientAdherence.has(pid)) patientAdherence.set(pid, { taken: 0, total: 0 });
      const pa = patientAdherence.get(pid)!;

      for (const med of call.medicinesChecked || []) {
        pa.total++;
        if (med.response === 'taken') pa.taken++;
        if (med.isCritical && med.response === 'missed') criticalMisses++;
      }

      // Complaints
      const complaints = (call.complaints || []).filter((c: string) => c && c !== 'none');
      const dateKey = call.scheduledAt.toISOString().split('T')[0];
      dailyComplaints.set(dateKey, (dailyComplaints.get(dateKey) || 0) + complaints.length);
      for (const c of complaints) {
        complaintsMap.set(c, (complaintsMap.get(c) || 0) + 1);
      }

      // Mood
      const mood = call.moodNotes || 'unknown';
      if (mood in moodCounts) moodCounts[mood as keyof typeof moodCounts]++;
      else moodCounts.unknown++;
    }

    // Adherence distribution buckets
    const distribution = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
    for (const [, data] of patientAdherence) {
      const pct = data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0;
      if (pct <= 25) distribution['0-25']++;
      else if (pct <= 50) distribution['26-50']++;
      else if (pct <= 75) distribution['51-75']++;
      else distribution['76-100']++;
    }

    // Top complaints
    const topComplaints = Array.from(complaintsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([complaint, count]) => ({ complaint, count }));

    // Complaints trend (daily)
    const complaintsTrend: { date: string; count: number }[] = [];
    for (let d = 0; d < days; d++) {
      const date = now.minus({ days: days - 1 - d }).toISODate()!;
      complaintsTrend.push({ date, count: dailyComplaints.get(date) || 0 });
    }

    return {
      adherenceDistribution: distribution,
      totalPatientsTracked: patientAdherence.size,
      totalPatientsRegistered: patients.length,
      topComplaints,
      complaintsTrend,
      criticalMisses,
      moodDistribution: moodCounts,
      period: { days, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
    };
  }

  async getBusinessAnalytics() {
    const [subscriptions, patients, users] = await Promise.all([
      this.subscriptionModel.find().lean(),
      this.patientModel.find().lean(),
      this.userModel.find({ role: { $in: ['payer', 'hospital_admin'] } }).lean(),
    ]);

    // Subscription status breakdown
    const statusBreakdown = { trial: 0, active: 0, past_due: 0, cancelled: 0, expired: 0 };
    const planBreakdown = { suraksha: 0, sampurna: 0 };
    let mrr = 0;

    for (const sub of subscriptions) {
      if (sub.status in statusBreakdown) statusBreakdown[sub.status as keyof typeof statusBreakdown]++;
      if (sub.status === 'active') {
        mrr += sub.planPrice || 0;
        if (sub.plan in planBreakdown) planBreakdown[sub.plan as keyof typeof planBreakdown]++;
      }
    }

    // Patient growth (by month)
    const growthMap = new Map<string, number>();
    for (const p of patients) {
      const monthKey = (p as any).createdAt?.toISOString().slice(0, 7);
      if (monthKey) growthMap.set(monthKey, (growthMap.get(monthKey) || 0) + 1);
    }
    const patientGrowth = Array.from(growthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, newPatients: count }));

    // Churn: cancelled / (active + cancelled)
    const totalActive = statusBreakdown.active + statusBreakdown.trial;
    const totalCancelled = statusBreakdown.cancelled + statusBreakdown.expired;
    const churnRate = (totalActive + totalCancelled) > 0
      ? Math.round((totalCancelled / (totalActive + totalCancelled)) * 100)
      : 0;

    // Trial conversion: active subs that were once trial
    const trialConversionRate = patients.length > 0
      ? Math.round((statusBreakdown.active / patients.length) * 100)
      : 0;

    // Patient subscription status (from patient model, not subscription collection)
    const patientSubStatus = { trial: 0, active: 0, past_due: 0, cancelled: 0, expired: 0 };
    for (const p of patients) {
      const s = p.subscriptionStatus as keyof typeof patientSubStatus;
      if (s in patientSubStatus) patientSubStatus[s]++;
    }

    return {
      subscriptionBreakdown: statusBreakdown,
      patientSubscriptionBreakdown: patientSubStatus,
      planBreakdown,
      mrr,
      totalPayers: users.length,
      totalPatients: patients.length,
      patientGrowth,
      churnRate,
      trialConversionRate,
    };
  }

  async getOperationsAnalytics(days: number = 30) {
    const now = DateTime.now().setZone('Asia/Kolkata');
    const startDate = now.minus({ days }).startOf('day').toJSDate();
    const endDate = now.endOf('day').toJSDate();

    const calls = await this.callModel.find({
      scheduledAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalCalls = calls.length;
    const completed = calls.filter(c => c.status === 'completed');
    const failed = calls.filter(c => ['failed', 'no_answer', 'busy', 'declined'].includes(c.status));
    const retries = calls.filter(c => c.isRetry);

    // Success rate trend (daily)
    const dailyStats = new Map<string, { total: number; completed: number; failed: number; duration: number; cost: number }>();
    for (const call of calls) {
      const dateKey = call.scheduledAt.toISOString().split('T')[0];
      if (!dailyStats.has(dateKey)) dailyStats.set(dateKey, { total: 0, completed: 0, failed: 0, duration: 0, cost: 0 });
      const day = dailyStats.get(dateKey)!;
      day.total++;
      if (call.status === 'completed') {
        day.completed++;
        day.duration += call.duration || 0;
      }
      if (['failed', 'no_answer', 'busy', 'declined'].includes(call.status)) day.failed++;
      day.cost += call.totalCharges || 0;
    }

    const dailyTrend: any[] = [];
    for (let d = 0; d < days; d++) {
      const date = now.minus({ days: days - 1 - d }).toISODate()!;
      const dayData = dailyStats.get(date);
      dailyTrend.push({
        date,
        total: dayData?.total || 0,
        completed: dayData?.completed || 0,
        failed: dayData?.failed || 0,
        successRate: dayData && dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0,
        avgDuration: dayData && dayData.completed > 0 ? Math.round(dayData.duration / dayData.completed) : 0,
        cost: Math.round((dayData?.cost || 0) * 100) / 100,
      });
    }

    // Voice stack comparison
    const voiceStacks = { elevenlabs: { total: 0, completed: 0, cost: 0 }, sarvam: { total: 0, completed: 0, cost: 0 } };
    for (const call of calls) {
      const stack = (call.voiceStack || 'elevenlabs') as keyof typeof voiceStacks;
      if (stack in voiceStacks) {
        voiceStacks[stack].total++;
        if (call.status === 'completed') voiceStacks[stack].completed++;
        voiceStacks[stack].cost += call.totalCharges || 0;
      }
    }

    // Failure reasons
    const failureReasons = new Map<string, number>();
    for (const call of failed) {
      const reason = call.terminationReason || call.status;
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
    }

    // Total costs
    let totalTwilioCost = 0;
    let totalElevenlabsCost = 0;
    let totalCost = 0;
    for (const call of calls) {
      totalTwilioCost += call.twilioCharges || 0;
      totalElevenlabsCost += call.elevenlabsCharges || 0;
      totalCost += call.totalCharges || 0;
    }

    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((sum, c) => sum + (c.duration || 0), 0) / completed.length)
      : 0;

    return {
      summary: {
        totalCalls,
        completed: completed.length,
        failed: failed.length,
        successRate: totalCalls > 0 ? Math.round((completed.length / totalCalls) * 100) : 0,
        avgDuration,
        retryRate: totalCalls > 0 ? Math.round((retries.length / totalCalls) * 100) : 0,
        costPerCall: completed.length > 0 ? Math.round((totalCost / completed.length) * 100) / 100 : 0,
      },
      dailyTrend,
      voiceStacks: {
        elevenlabs: {
          ...voiceStacks.elevenlabs,
          successRate: voiceStacks.elevenlabs.total > 0 ? Math.round((voiceStacks.elevenlabs.completed / voiceStacks.elevenlabs.total) * 100) : 0,
          cost: Math.round(voiceStacks.elevenlabs.cost * 100) / 100,
        },
        sarvam: {
          ...voiceStacks.sarvam,
          successRate: voiceStacks.sarvam.total > 0 ? Math.round((voiceStacks.sarvam.completed / voiceStacks.sarvam.total) * 100) : 0,
          cost: Math.round(voiceStacks.sarvam.cost * 100) / 100,
        },
      },
      failureReasons: Array.from(failureReasons.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => ({ reason, count })),
      costs: {
        twilio: Math.round(totalTwilioCost * 100) / 100,
        elevenlabs: Math.round(totalElevenlabsCost * 100) / 100,
        total: Math.round(totalCost * 100) / 100,
      },
      period: { days, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
    };
  }
}
