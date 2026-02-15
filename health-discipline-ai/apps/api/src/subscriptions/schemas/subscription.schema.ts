import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, enum: ['saathi', 'suraksha', 'sampurna'] })
  plan: string;

  @Prop({ required: true })
  planPrice: number;

  @Prop({ enum: ['monthly', 'annual'], default: 'monthly' })
  billingCycle: string;

  @Prop({
    required: true,
    enum: ['trial', 'active', 'past_due', 'cancelled', 'expired'],
    default: 'trial',
  })
  status: string;

  @Prop()
  trialStartedAt?: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ enum: ['razorpay', 'stripe'] })
  paymentGateway?: string;

  @Prop()
  razorpaySubscriptionId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  gracePeriodEndsAt?: Date;

  @Prop()
  cancellationReason?: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ patientId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
