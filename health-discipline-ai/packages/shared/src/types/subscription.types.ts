import { SubscriptionStatus } from '../enums';

export type SubscriptionPlan = 'saathi' | 'suraksha' | 'sampurna';
export type PaymentGateway = 'razorpay' | 'stripe';
export type BillingCycle = 'monthly' | 'annual';

export interface Subscription {
  _id: string;
  userId: string;
  patientId: string;
  plan: SubscriptionPlan;
  planPrice: number;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  paymentGateway: PaymentGateway;
  razorpaySubscriptionId?: string;
  stripeSubscriptionId?: string;
  gracePeriodEndsAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionDto {
  patientId: string;
  plan: SubscriptionPlan;
  paymentGateway: PaymentGateway;
}

export interface SubscriptionResponse extends Subscription {}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  features: string[];
}
