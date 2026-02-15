import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FamilyMemberDocument = FamilyMember & Document;

@Schema({ timestamps: true })
export class FamilyMember {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  primaryPayerId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ enum: ['weekly_plus_alerts', 'daily', 'alerts_only'], default: 'weekly_plus_alerts' })
  notificationLevel: string;

  @Prop({ default: false })
  canEditMedicines: boolean;

  @Prop({ default: false })
  canPauseCalls: boolean;

  @Prop({ default: true })
  canViewReports: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const FamilyMemberSchema = SchemaFactory.createForClass(FamilyMember);

FamilyMemberSchema.index({ patientId: 1 });
FamilyMemberSchema.index({ phone: 1 });
