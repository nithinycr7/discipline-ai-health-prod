import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ sparse: true, unique: true })
  phone?: string;

  @Prop({ sparse: true, unique: true })
  email?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['payer', 'hospital_admin', 'monitor', 'super_admin'] })
  role: string;

  @Prop()
  location?: string;

  @Prop({ default: 'Asia/Kolkata' })
  timezone: string;

  @Prop()
  relationshipToPatient?: string;

  @Prop({
    type: {
      weekly: { type: Boolean, default: true },
      daily: { type: Boolean, default: false },
      alerts: { type: Boolean, default: true },
    },
    default: { weekly: true, daily: false, alerts: true },
  })
  notificationPreferences: {
    weekly: boolean;
    daily: boolean;
    alerts: boolean;
  };

  @Prop()
  health_onboarding_step?: string;

  @Prop()
  hospitalName?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ sparse: true, unique: true })
  firebaseUid?: string;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ enum: ['phone', 'email', 'google', 'apple'], default: 'phone' })
  authProvider: string;

  @Prop({ enum: ['test', 'normal'], default: 'test' })
  tag: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });
