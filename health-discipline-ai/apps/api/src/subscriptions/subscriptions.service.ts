import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';

const PLAN_PRICES: Record<string, number> = {
  suraksha: 1350,
  sampurna: 1800,
};

const FREE_TRIAL_DAYS = 7;
const GRACE_PERIOD_DAYS = 3;

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(userId: string, patientId: string, plan: string, paymentGateway?: string): Promise<SubscriptionDocument> {
    if (!PLAN_PRICES[plan]) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    // Check existing active subscription
    const existing = await this.subscriptionModel.findOne({
      patientId: new Types.ObjectId(patientId),
      status: { $in: ['trial', 'active'] },
    });
    if (existing) {
      throw new BadRequestException('Patient already has an active subscription');
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);

    return this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      patientId: new Types.ObjectId(patientId),
      plan,
      planPrice: PLAN_PRICES[plan],
      billingCycle: 'monthly',
      status: 'trial',
      trialStartedAt: now,
      trialEndsAt: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      paymentGateway,
    });
  }

  async findByUser(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findByPatient(patientId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({
      patientId: new Types.ObjectId(patientId),
      status: { $in: ['trial', 'active', 'past_due'] },
    });
  }

  async findById(id: string): Promise<SubscriptionDocument> {
    const sub = await this.subscriptionModel.findById(id);
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async cancel(id: string, reason?: string): Promise<SubscriptionDocument> {
    const sub = await this.findById(id);
    if (['cancelled', 'expired'].includes(sub.status)) {
      throw new BadRequestException('Subscription is already cancelled or expired');
    }

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.cancellationReason = reason;
    // Service continues until end of current period
    sub.expiresAt = sub.currentPeriodEnd;
    return sub.save();
  }

  async handlePaymentSuccess(subscriptionId: string): Promise<SubscriptionDocument> {
    const sub = await this.findById(subscriptionId);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    sub.status = 'active';
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = periodEnd;
    sub.gracePeriodEndsAt = undefined;
    return sub.save();
  }

  async handlePaymentFailure(subscriptionId: string): Promise<SubscriptionDocument> {
    const sub = await this.findById(subscriptionId);
    sub.status = 'past_due';
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
    sub.gracePeriodEndsAt = gracePeriodEnd;
    return sub.save();
  }

  async processTrialExpirations(): Promise<void> {
    const expiredTrials = await this.subscriptionModel.find({
      status: 'trial',
      trialEndsAt: { $lte: new Date() },
    });

    for (const sub of expiredTrials) {
      sub.status = 'expired';
      sub.expiresAt = new Date();
      await sub.save();
    }
  }

  async processGracePeriodExpirations(): Promise<void> {
    const expired = await this.subscriptionModel.find({
      status: 'past_due',
      gracePeriodEndsAt: { $lte: new Date() },
    });

    for (const sub of expired) {
      sub.status = 'expired';
      sub.expiresAt = new Date();
      await sub.save();
    }
  }

  async isPatientSubscribed(patientId: string): Promise<boolean> {
    const sub = await this.findByPatient(patientId);
    if (!sub) return false;
    if (sub.status === 'past_due' && sub.gracePeriodEndsAt) {
      return new Date() < sub.gracePeriodEndsAt;
    }
    return ['trial', 'active'].includes(sub.status);
  }

  async getPlans() {
    return [
      {
        id: 'suraksha', name: 'Suraksha', price: 1350, currency: 'INR',
        features: ['1 call daily (7 days)', 'Real-time alerts', 'Up to 3 family members', 'Daily & weekly reports', 'Vitals tracking'],
      },
      {
        id: 'sampurna', name: 'Sampurna', price: 1800, currency: 'INR', popular: true,
        features: ['2 calls daily (7 days)', 'Weekly deep check-in', 'Doctor-ready reports', 'Priority support', 'Unlimited family members'],
      },
    ];
  }
}
