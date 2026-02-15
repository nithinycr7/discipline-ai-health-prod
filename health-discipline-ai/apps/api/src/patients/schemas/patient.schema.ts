import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  authorizedUsers: Types.ObjectId[];

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  preferredName: string;

  @Prop({ required: true, min: 1, max: 150 })
  age: number;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, default: 'hi' })
  preferredLanguage: string;

  @Prop({ required: true, default: 2, min: 0, max: 2 })
  digitalTier: number;

  @Prop({ type: [String], default: [] })
  healthConditions: string[];

  @Prop({ default: false })
  hasGlucometer: boolean;

  @Prop({ default: false })
  hasBPMonitor: boolean;

  @Prop({ enum: ['male', 'female'], default: 'female' })
  preferredVoiceGender: string;

  @Prop({ default: false })
  isPaused: boolean;

  @Prop()
  pauseReason?: string;

  @Prop()
  pausedUntil?: Date;

  @Prop({ default: 0 })
  callsCompletedCount: number;

  @Prop({ default: true })
  isNewPatient: boolean;

  @Prop()
  firstCallAt?: Date;

  @Prop()
  lastCallAt?: Date;

  @Prop({ enum: ['valid', 'invalid'], default: 'valid' })
  phoneStatus: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

PatientSchema.index({ userId: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ isPaused: 1 });
