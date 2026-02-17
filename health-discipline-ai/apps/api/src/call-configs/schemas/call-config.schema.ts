import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallConfigDocument = CallConfig & Document;

@Schema({ timestamps: true })
export class CallConfig {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, unique: true })
  patientId: Types.ObjectId;

  @Prop()
  morningCallTime?: string;

  @Prop()
  afternoonCallTime?: string;

  @Prop()
  eveningCallTime?: string;

  @Prop()
  nightCallTime?: string;

  @Prop({ required: true, default: 'Asia/Kolkata' })
  timezone: string;

  @Prop({ default: true })
  retryEnabled: boolean;

  @Prop({ default: 30 })
  retryIntervalMinutes: number;

  @Prop({ default: 2 })
  maxRetries: number;

  @Prop({ type: [String], default: ['no_answer', 'busy'] })
  retryOnlyForStatuses: string[];

  @Prop({ default: false })
  useSlowerSpeechRate: boolean;

  @Prop({ default: 180 })
  callDurationTarget: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  dynamicPromptEnabled: boolean;
}

export const CallConfigSchema = SchemaFactory.createForClass(CallConfig);

CallConfigSchema.index({ patientId: 1 }, { unique: true });
CallConfigSchema.index({ isActive: 1 });
