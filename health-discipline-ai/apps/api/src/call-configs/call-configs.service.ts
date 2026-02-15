import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallConfig, CallConfigDocument } from './schemas/call-config.schema';

@Injectable()
export class CallConfigsService {
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
        { eveningCallTime: timeStr },
      ],
    });
  }
}
