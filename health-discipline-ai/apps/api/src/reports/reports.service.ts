import { Injectable, Logger } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { PatientsService } from '../patients/patients.service';
import { MedicinesService } from '../medicines/medicines.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private callsService: CallsService,
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
  ) {}

  async generateWeeklyReport(patientId: string, weekStart: Date, weekEnd: Date) {
    const patient = await this.patientsService.findById(patientId);
    const medicines = await this.medicinesService.findByPatient(patientId);

    // Get all calls for the week
    const { calls } = await this.callsService.findByPatient(patientId, {
      startDate: weekStart,
      endDate: weekEnd,
      limit: 100,
    });

    // Calculate per-medicine adherence
    const medicineStats = new Map<string, { taken: number; missed: number; total: number }>();
    for (const med of medicines) {
      medicineStats.set(med._id.toString(), { taken: 0, missed: 0, total: 0 });
    }

    for (const call of calls) {
      if (call.status !== 'completed') continue;
      for (const check of call.medicinesChecked) {
        const stats = medicineStats.get(check.medicineId?.toString());
        if (stats) {
          stats.total++;
          if (check.response === 'taken') stats.taken++;
          else if (check.response === 'missed') stats.missed++;
        }
      }
    }

    // Collect vitals
    const glucoseReadings: number[] = [];
    const bpReadings: { systolic: number; diastolic: number }[] = [];
    const moodNotes: string[] = [];

    for (const call of calls) {
      if (call.vitals?.glucose) glucoseReadings.push(call.vitals.glucose);
      if (call.vitals?.bloodPressure) bpReadings.push(call.vitals.bloodPressure);
      if (call.moodNotes) moodNotes.push(call.moodNotes);
    }

    // Calculate overall adherence
    let totalTaken = 0;
    let totalMeds = 0;
    medicineStats.forEach((stats) => {
      totalTaken += stats.taken;
      totalMeds += stats.total;
    });

    const overallAdherence = totalMeds > 0 ? Math.round((totalTaken / totalMeds) * 100) : 0;

    // Missed medicines highlight
    const missedMedicines: string[] = [];
    medicineStats.forEach((stats, medId) => {
      if (stats.missed > 0) {
        const med = medicines.find((m) => m._id.toString() === medId);
        if (med) missedMedicines.push(`${med.brandName} (missed ${stats.missed} times)`);
      }
    });

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      patientName: patient.preferredName,
      adherence: {
        overall: overallAdherence,
        byMedicine: medicines.map((med) => {
          const stats = medicineStats.get(med._id.toString()) || { taken: 0, missed: 0, total: 0 };
          return {
            medicineId: med._id.toString(),
            name: med.brandName,
            taken: stats.taken,
            missed: stats.missed,
            percentage: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0,
          };
        }),
      },
      vitals: {
        glucose: {
          readings: glucoseReadings,
          average: glucoseReadings.length > 0 ? Math.round(glucoseReadings.reduce((a, b) => a + b, 0) / glucoseReadings.length) : null,
          trend: this.calculateTrend(glucoseReadings),
        },
        bloodPressure: {
          systolic: bpReadings.map((r) => r.systolic),
          diastolic: bpReadings.map((r) => r.diastolic),
          average: bpReadings.length > 0
            ? {
                systolic: Math.round(bpReadings.reduce((a, b) => a + b.systolic, 0) / bpReadings.length),
                diastolic: Math.round(bpReadings.reduce((a, b) => a + b.diastolic, 0) / bpReadings.length),
              }
            : null,
        },
      },
      moodSummary: moodNotes.length > 0 ? moodNotes.join('; ') : 'No mood data collected',
      missedMedicinesHighlight: missedMedicines,
      totalCallsCompleted: calls.filter((c) => c.status === 'completed').length,
      totalCallsMissed: calls.filter((c) => ['no_answer', 'failed'].includes(c.status)).length,
    };
  }

  private calculateTrend(readings: number[]): string {
    if (readings.length < 3) return 'insufficient_data';
    const firstHalf = readings.slice(0, Math.floor(readings.length / 2));
    const secondHalf = readings.slice(Math.floor(readings.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < firstAvg * 0.05) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }
}
