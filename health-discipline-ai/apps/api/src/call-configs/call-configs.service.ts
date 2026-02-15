import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallConfig, CallConfigDocument } from './schemas/call-config.schema';

export const SAMPURNA_DEFAULT_CALL_TIMES: Record<string, string> = {
  morning: '08:30',
  afternoon: '13:30',
  evening: '19:30',
  night: '21:30',
};

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

  async getDueCallConfigs(currentHour: number, currentMinute: number): Promise<CallConfigDocument[]> {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    return this.callConfigModel.find({
      isActive: true,
      $or: [
        { morningCallTime: timeStr },
        { afternoonCallTime: timeStr },
        { eveningCallTime: timeStr },
        { nightCallTime: timeStr },
      ],
    });
  }

  /**
   * Auto-create or update a CallConfig when a medicine is added.
   * Sampurna plan: auto-set default times.
   * Suraksha: set 'pending' — user must provide the time.
   */
  async createOrUpdateForMedicine(
    patientId: string,
    timing: string,
    plan: string,
  ): Promise<CallConfigDocument> {
    const callTimeField = TIMING_TO_FIELD[timing];
    if (!callTimeField) {
      throw new Error(`Invalid timing: ${timing}`);
    }

    const timeValue = plan === 'sampurna'
      ? SAMPURNA_DEFAULT_CALL_TIMES[timing]
      : 'pending';

    const existing = await this.findByPatient(patientId);

    if (existing) {
      // Only set if the slot doesn't already have a real time
      if (!existing[callTimeField] || existing[callTimeField] === 'pending') {
        await this.callConfigModel.findByIdAndUpdate(
          existing._id,
          { $set: { [callTimeField]: timeValue } },
        );
      }
      return this.findByPatient(patientId);
    }

    // Create new config
    return this.callConfigModel.create({
      patientId: new Types.ObjectId(patientId),
      timezone: 'Asia/Kolkata',
      isActive: true,
      [callTimeField]: timeValue,
    });
  }

  /**
   * Clear a time slot when no medicines remain for it.
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
