import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicineDocument = Medicine & Document;

@Schema({ timestamps: true })
export class Medicine {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  brandName: string;

  @Prop()
  genericName?: string;

  @Prop()
  dosage?: string;

  @Prop({ required: true, enum: ['morning', 'afternoon', 'evening', 'night'] })
  timing: string;

  @Prop({ required: true, enum: ['before', 'after', 'with', 'anytime'], default: 'anytime' })
  foodPreference: string;

  @Prop({ type: [String], default: [] })
  nicknames: string[];

  @Prop()
  linkedCondition?: string;

  @Prop({ default: false })
  isCritical: boolean;

  @Prop({ type: Types.ObjectId, ref: 'MedicineCatalog' })
  catalogId?: Types.ObjectId;

  @Prop({ default: false })
  needsReview: boolean;

  @Prop()
  reviewedAt?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const MedicineSchema = SchemaFactory.createForClass(Medicine);

MedicineSchema.index({ patientId: 1, timing: 1 });
MedicineSchema.index({ patientId: 1, isActive: 1 });
MedicineSchema.index({ needsReview: 1, createdAt: 1 });
