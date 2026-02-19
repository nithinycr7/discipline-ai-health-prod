import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallConfig, CallConfigDocument } from './schemas/call-config.schema';

// Night call window: 20:00 – 20:55 IST, staggered in 5-min slots
const NIGHT_CALL_START_HOUR = 20;
const NIGHT_CALL_START_MIN = 0;
const NIGHT_CALL_SLOT_INTERVAL = 5; // minutes
const NIGHT_CALL_SLOT_COUNT = 12; // 12 slots × 5 min = 60 min window

export const TIMING_TO_FIELD: Record<string, string> = {
  morning: 'morningCallTime',
  afternoon: 'afternoonCallTime',
  evening: 'eveningCallTime',
  night: 'nightCallTime',
};

@Injectable()
export class CallConfigsService {
  private readonly logger = new Logger(CallConfigsService.name);

  constructor(
    @InjectModel(CallConfig.name) private callConfigModel: Model<CallConfigDocument>,
  ) {}

  async create(data: Partial<CallConfig>): Promise<CallConfigDocument> {
    return this.callConfigModel.create(data);
  }

  async findByPatient(patientId: string): Promise<CallConfigDocument | null> {
    return this.callConfigModel.findOne({ patientId: new Types.ObjectId(patientId) });
  }

  async update(patientId: string, data: Partial<CallConfig>): Promise<CallConfigDocument> {
    const config = await this.callConfigModel.findOneAndUpdate(
      { patientId: new Types.ObjectId(patientId) },
      { $set: data },
      { new: true, upsert: true },
    );
    return config;
  }

  async getActiveConfigs(): Promise<CallConfigDocument[]> {
    return this.callConfigModel.find({ isActive: true });
  }

  /**
   * Auto-create or update a CallConfig when a medicine is added.
   * Always sets nightCallTime — we call once at night for ALL medicines.
   * Staggered across 20:00–20:55 to avoid crowding.
   */
  async createOrUpdateForMedicine(
    patientId: string,
    _timing: string,
    _plan: string,
  ): Promise<CallConfigDocument> {
    const existing = await this.findByPatient(patientId);

    // If config already has a nightCallTime set, keep it
    if (existing?.nightCallTime && existing.nightCallTime !== 'pending') {
      return existing;
    }

    // Pick the least-crowded 5-minute slot between 20:00 and 20:55
    const nightTime = await this.getLeastCrowdedSlot();

    if (existing) {
      return this.callConfigModel.findByIdAndUpdate(
        existing._id,
        { $set: { nightCallTime: nightTime } },
        { new: true },
      );
    }

    return this.callConfigModel.create({
      patientId: new Types.ObjectId(patientId),
      timezone: 'Asia/Kolkata',
      isActive: true,
      nightCallTime: nightTime,
    });
  }

  /**
   * Find the 5-min slot (20:00–20:55) with the fewest active patients.
   * Returns time string like "20:15".
   */
  private async getLeastCrowdedSlot(): Promise<string> {
    // Build all possible slots
    const slots: string[] = [];
    for (let i = 0; i < NIGHT_CALL_SLOT_COUNT; i++) {
      const totalMin = NIGHT_CALL_START_HOUR * 60 + NIGHT_CALL_START_MIN + i * NIGHT_CALL_SLOT_INTERVAL;
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    // Count active configs per slot
    const counts = await this.callConfigModel.aggregate([
      { $match: { isActive: true, nightCallTime: { $in: slots } } },
      { $group: { _id: '$nightCallTime', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const { _id, count } of counts) {
      countMap.set(_id, count);
    }

    // Pick the slot with the fewest patients (first one wins ties)
    let bestSlot = slots[0];
    let bestCount = countMap.get(slots[0]) || 0;

    for (const slot of slots) {
      const c = countMap.get(slot) || 0;
      if (c < bestCount) {
        bestSlot = slot;
        bestCount = c;
      }
    }

    this.logger.log(`Assigned night call slot ${bestSlot} (${bestCount} existing patients in this slot)`);
    return bestSlot;
  }

  /**
   * Clear a time slot when no medicines remain for the patient.
   */
  async clearSlot(patientId: string, timing: string): Promise<void> {
    const callTimeField = TIMING_TO_FIELD[timing];
    if (!callTimeField) return;

    const existing = await this.findByPatient(patientId);
    if (existing) {
      await this.callConfigModel.findByIdAndUpdate(
        existing._id,
        { $unset: { [callTimeField]: 1 } },
      );
    }
  }
}
