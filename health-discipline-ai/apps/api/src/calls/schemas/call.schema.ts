import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallDocument = Call & Document;

@Schema()
class MedicineCheckEntry {
  @Prop({ type: Types.ObjectId, ref: 'Medicine', required: true })
  medicineId: Types.ObjectId;

  @Prop({ required: true })
  medicineName: string;

  @Prop({ default: '' })
  nickname: string;

  @Prop({ enum: ['taken', 'missed', 'unclear', 'pending'], default: 'pending' })
  response: string;

  @Prop({ default: false })
  isCritical: boolean;

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema()
class VitalsEntry {
  @Prop()
  glucose?: number;

  @Prop({ type: { systolic: Number, diastolic: Number } })
  bloodPressure?: { systolic: number; diastolic: number };

  @Prop({ default: Date.now })
  capturedAt: Date;
}

@Schema({ timestamps: true })
export class Call {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop()
  initiatedAt?: Date;

  @Prop()
  answeredAt?: Date;

  @Prop()
  endedAt?: Date;

  @Prop()
  duration?: number;

  @Prop({
    required: true,
    enum: ['scheduled', 'in_progress', 'completed', 'no_answer', 'busy', 'failed', 'declined'],
    default: 'scheduled',
  })
  status: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: false })
  isRetry: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Call' })
  originalCallId?: Types.ObjectId;

  @Prop({ type: [MedicineCheckEntry], default: [] })
  medicinesChecked: MedicineCheckEntry[];

  @Prop({ type: VitalsEntry })
  vitals?: VitalsEntry;

  @Prop()
  moodNotes?: string;

  @Prop({ type: [String], default: [] })
  complaints: string[];

  @Prop()
  twilioCallSid?: string;

  @Prop()
  elevenlabsConversationId?: string;

  @Prop({ enum: ['elevenlabs', 'sarvam'], default: 'elevenlabs' })
  voiceStack?: string;

  @Prop()
  livekitRoomName?: string;

  @Prop()
  recordingUrl?: string;

  @Prop()
  transcriptUrl?: string;

  @Prop({ type: [Object], default: [] })
  transcript: Array<{ role: string; message: string; timestamp?: Date }>;

  @Prop()
  twilioCharges?: number;

  @Prop()
  elevenlabsCharges?: number;

  @Prop()
  totalCharges?: number;

  @Prop()
  terminationReason?: string;

  @Prop()
  elevenlabsCostCredits?: number;

  @Prop({ default: false })
  isFirstCall: boolean;

  @Prop({ default: false })
  usedNewPatientProtocol: boolean;

  // Dynamic prompt tracking
  @Prop({
    enum: ['standard', 'wellness_first', 'quick_check', 'celebration', 'gentle_reengagement'],
  })
  conversationVariant?: string;

  @Prop({
    enum: ['warm_cheerful', 'gentle_concerned', 'celebratory_proud', 'light_breezy', 'reassuring_patient', 'festive_joyful'],
  })
  toneUsed?: string;

  @Prop({
    enum: ['stranger', 'acquaintance', 'familiar', 'trusted', 'family'],
  })
  relationshipStage?: string;

  @Prop({ type: [String], default: [] })
  screeningQuestionsAsked: string[];

  @Prop({ default: false })
  reScheduled: boolean;
}

export const CallSchema = SchemaFactory.createForClass(Call);

CallSchema.index({ patientId: 1, scheduledAt: -1 });
CallSchema.index({ patientId: 1, status: 1 });
CallSchema.index({ scheduledAt: 1, status: 1 });
CallSchema.index({ userId: 1, createdAt: -1 });
