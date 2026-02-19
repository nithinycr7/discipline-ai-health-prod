import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Call, CallDocument } from './schemas/call.schema';
import { DateTime } from 'luxon';

@Injectable()
export class CallsService {
  constructor(@InjectModel(Call.name) private callModel: Model<CallDocument>) {}

  async create(data: Partial<Call>): Promise<CallDocument> {
    return this.callModel.create(data);
  }

  /**
   * Check if a non-retry call already exists for this patient today
   * (in the patient's timezone). Prevents duplicate scheduling.
   */
  async hasCallToday(patientId: string, timezone: string): Promise<boolean> {
    const now = DateTime.now().setZone(timezone || 'Asia/Kolkata');
    const startOfDay = now.startOf('day').toJSDate();
    const endOfDay = now.endOf('day').toJSDate();

    const count = await this.callModel.countDocuments({
      patientId: new Types.ObjectId(patientId),
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      isRetry: { $ne: true },
    });

    return count > 0;
  }

  async findById(id: string): Promise<CallDocument> {
    const call = await this.callModel.findById(id);
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  async findByTwilioSid(sid: string): Promise<CallDocument | null> {
    return this.callModel.findOne({ twilioCallSid: sid });
  }

  async findByPatient(
    patientId: string,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {},
  ) {
    const { page = 1, limit = 20, startDate, endDate } = options;
    const filter: any = { patientId: new Types.ObjectId(patientId) };

    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = startDate;
      if (endDate) filter.scheduledAt.$lte = endDate;
    }

    const [calls, total] = await Promise.all([
      this.callModel
        .find(filter)
        .sort({ scheduledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.callModel.countDocuments(filter),
    ]);

    return { calls, total, page, pageSize: limit };
  }

  async getAdherenceForDate(patientId: string, date: Date, timezone = 'Asia/Kolkata') {
    const dt = DateTime.fromJSDate(date).setZone(timezone);
    const startOfDay = dt.startOf('day').toJSDate();
    const endOfDay = dt.endOf('day').toJSDate();

    const calls = await this.callModel.find({
      patientId: new Types.ObjectId(patientId),
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed',
    });

    const allMedicines: any[] = [];
    for (const call of calls) {
      for (const med of call.medicinesChecked || []) {
        allMedicines.push(med);
      }
    }

    const taken = allMedicines.filter((m) => m.response === 'taken').length;
    const missed = allMedicines.filter((m) => m.response === 'missed').length;
    const pending = allMedicines.filter((m) => m.response === 'pending' || m.response === 'unclear').length;
    const total = allMedicines.length;

    // Get latest vitals and mood
    const latestCall = calls[calls.length - 1];

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalMedicines: total,
      taken,
      missed,
      pending,
      adherencePercentage: total > 0 ? Math.round((taken / total) * 100) : 0,
      medicineDetails: allMedicines.map((m) => ({
        medicineId: m.medicineId?.toString(),
        name: m.medicineName,
        nickname: m.nickname,
        status: m.response,
        timing: '', // populated from medicine data
      })),
      vitals: latestCall?.vitals,
      moodNotes: latestCall?.moodNotes,
      complaints: latestCall?.complaints?.filter((c: string) => c && c !== 'none') || [],
      lastCallAt: latestCall?.endedAt || latestCall?.scheduledAt,
    };
  }

  async getAdherenceCalendar(patientId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const calls = await this.callModel.find({
      patientId: new Types.ObjectId(patientId),
      scheduledAt: { $gte: startDate, $lte: endDate },
      status: 'completed',
    });

    // Group by day
    const dayMap = new Map<string, { taken: number; total: number }>();

    for (const call of calls) {
      const dateKey = call.scheduledAt.toISOString().split('T')[0];
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { taken: 0, total: 0 });
      }
      const day = dayMap.get(dateKey)!;
      for (const med of call.medicinesChecked || []) {
        day.total++;
        if (med.response === 'taken') day.taken++;
      }
    }

    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = dayMap.get(dateStr);

      let status: string;
      let adherencePercentage = 0;

      if (!dayData || dayData.total === 0) {
        status = 'no_data';
      } else {
        adherencePercentage = Math.round((dayData.taken / dayData.total) * 100);
        status = adherencePercentage === 100 ? 'full' : adherencePercentage > 0 ? 'partial' : 'missed';
      }

      days.push({ date: dateStr, adherencePercentage, status });
    }

    const allTotals = Array.from(dayMap.values());
    const totalTaken = allTotals.reduce((sum, d) => sum + d.taken, 0);
    const totalMeds = allTotals.reduce((sum, d) => sum + d.total, 0);

    return {
      days,
      monthlyAdherence: totalMeds > 0 ? Math.round((totalTaken / totalMeds) * 100) : 0,
    };
  }

  async updateCallStatus(
    callId: string,
    status: string,
    additionalData?: Partial<Call>,
  ): Promise<CallDocument> {
    const update: any = { status, ...additionalData };
    if (status === 'completed') update.endedAt = new Date();
    if (status === 'in_progress') update.answeredAt = new Date();

    const call = await this.callModel.findByIdAndUpdate(callId, { $set: update }, { new: true });
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  /**
   * Update an existing medicine entry's response in-place (no duplicates).
   * Falls back to $push only if the medicineId doesn't exist in the array.
   */
  async addMedicineResponse(
    callId: string,
    medicineId: string,
    medicineName: string,
    nickname: string,
    response: string,
  ): Promise<CallDocument> {
    // Try to update existing entry first (positional $ operator)
    const updated = await this.callModel.findOneAndUpdate(
      { _id: callId, 'medicinesChecked.medicineId': new Types.ObjectId(medicineId) },
      {
        $set: {
          'medicinesChecked.$.response': response,
          'medicinesChecked.$.timestamp': new Date(),
        },
      },
      { new: true },
    );

    if (updated) return updated;

    // Entry doesn't exist yet — push a new one
    return this.callModel.findByIdAndUpdate(
      callId,
      {
        $push: {
          medicinesChecked: {
            medicineId: new Types.ObjectId(medicineId),
            medicineName,
            nickname,
            response,
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );
  }

  async addVitals(callId: string, vitals: any): Promise<CallDocument> {
    return this.callModel.findByIdAndUpdate(
      callId,
      { $set: { vitals: { ...vitals, capturedAt: new Date() } } },
      { new: true },
    );
  }

  async getCallsForFirst48Hours(patientId: string): Promise<CallDocument[]> {
    const patient = await this.callModel.db.model('Patient').findById(patientId);
    if (!patient?.firstCallAt) return [];

    const cutoff = new Date(patient.firstCallAt);
    cutoff.setHours(cutoff.getHours() + 48);

    return this.callModel.find({
      patientId: new Types.ObjectId(patientId),
      scheduledAt: { $lte: cutoff },
    });
  }

  async getPatientStats(patientId: string, days: number = 30, timezone = 'Asia/Kolkata') {
    const now = DateTime.now().setZone(timezone);
    const endDate = now.endOf('day').toJSDate();
    const startDate = now.minus({ days }).startOf('day').toJSDate();

    const calls = await this.callModel.find({
      patientId: new Types.ObjectId(patientId),
      scheduledAt: { $gte: startDate, $lte: endDate },
    }).sort({ scheduledAt: 1 });

    // --- Adherence trend (daily) ---
    const trendMap = new Map<string, { taken: number; total: number }>();
    for (const call of calls) {
      if (call.status !== 'completed') continue;
      const dateKey = call.scheduledAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) trendMap.set(dateKey, { taken: 0, total: 0 });
      const day = trendMap.get(dateKey)!;
      for (const med of call.medicinesChecked || []) {
        day.total++;
        if (med.response === 'taken') day.taken++;
      }
    }

    const adherenceTrend: { date: string; percentage: number; taken: number; total: number }[] = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = trendMap.get(dateStr);
      adherenceTrend.push({
        date: dateStr,
        taken: dayData?.taken || 0,
        total: dayData?.total || 0,
        percentage: dayData && dayData.total > 0
          ? Math.round((dayData.taken / dayData.total) * 100) : -1,
      });
    }

    // --- Vitals history ---
    const glucoseHistory: { date: string; value: number }[] = [];
    const bpHistory: { date: string; systolic: number; diastolic: number }[] = [];
    for (const call of calls) {
      if (call.status !== 'completed' || !call.vitals) continue;
      const dateStr = call.scheduledAt.toISOString().split('T')[0];
      if (call.vitals.glucose) {
        glucoseHistory.push({ date: dateStr, value: call.vitals.glucose });
      }
      if (call.vitals.bloodPressure?.systolic) {
        bpHistory.push({
          date: dateStr,
          systolic: call.vitals.bloodPressure.systolic,
          diastolic: call.vitals.bloodPressure.diastolic,
        });
      }
    }

    // --- Mood history ---
    const moodHistory: { date: string; mood: string; complaints: string[] }[] = [];
    for (const call of calls) {
      if (call.status !== 'completed') continue;
      if (call.moodNotes || (call.complaints && call.complaints.length > 0)) {
        moodHistory.push({
          date: call.scheduledAt.toISOString().split('T')[0],
          mood: call.moodNotes || '',
          complaints: call.complaints || [],
        });
      }
    }

    // --- Per-medicine adherence ---
    const medMap = new Map<string, { name: string; taken: number; total: number }>();
    for (const call of calls) {
      if (call.status !== 'completed') continue;
      for (const med of call.medicinesChecked || []) {
        const key = med.medicineId?.toString() || med.medicineName;
        if (!medMap.has(key)) medMap.set(key, { name: med.medicineName, taken: 0, total: 0 });
        const m = medMap.get(key)!;
        m.total++;
        if (med.response === 'taken') m.taken++;
      }
    }
    const perMedicineAdherence = Array.from(medMap.entries()).map(([id, data]) => ({
      medicineId: id,
      name: data.name,
      taken: data.taken,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
    }));

    // --- Call stats ---
    const completed = calls.filter((c) => c.status === 'completed').length;
    const noAnswer = calls.filter((c) => c.status === 'no_answer').length;
    const failed = calls.filter((c) => c.status === 'failed').length;

    return {
      adherenceTrend,
      vitalsHistory: { glucose: glucoseHistory, bloodPressure: bpHistory },
      moodHistory,
      perMedicineAdherence,
      callStats: { total: calls.length, completed, noAnswer, failed },
      period: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], days },
    };
  }

  /**
   * Find retry calls that are due for processing (scheduled + past due).
   */
  async findDueRetries(): Promise<CallDocument[]> {
    return this.callModel.find({
      status: 'scheduled',
      isRetry: true,
      scheduledAt: { $lte: new Date() },
    });
  }

  /**
   * Atomically claim a call for processing — only succeeds if still in expected status.
   * Prevents race conditions where two processes try to handle the same call.
   */
  async claimForProcessing(callId: string, expectedStatus: string): Promise<CallDocument | null> {
    return this.callModel.findOneAndUpdate(
      { _id: callId, status: expectedStatus },
      { $set: { status: 'in_progress' } },
      { new: true },
    );
  }

  async getDailyCostAggregation(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.callModel.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: null,
          totalTwilioCharges: { $sum: '$twilioCharges' },
          totalElevenlabsCharges: { $sum: '$elevenlabsCharges' },
          totalCharges: { $sum: '$totalCharges' },
          callCount: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
        },
      },
    ]);

    return result[0] || { totalTwilioCharges: 0, totalElevenlabsCharges: 0, totalCharges: 0, callCount: 0, totalDuration: 0 };
  }
}
