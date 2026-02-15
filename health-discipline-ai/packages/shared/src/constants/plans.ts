import { PlanInfo } from '../types';

export const SUBSCRIPTION_PLANS: PlanInfo[] = [
  {
    id: 'saathi',
    name: 'Saathi',
    price: 499,
    currency: 'INR',
    features: [
      '1 morning call (Mon-Fri)',
      'Weekly health report',
      'WhatsApp notifications',
      'Basic adherence tracking',
    ],
  },
  {
    id: 'suraksha',
    name: 'Suraksha',
    price: 999,
    currency: 'INR',
    features: [
      '2 calls daily (7 days)',
      'Real-time alerts for missed medicines',
      'Up to 3 family members',
      'Daily & weekly reports',
      'Vitals tracking (if available)',
    ],
  },
  {
    id: 'sampurna',
    name: 'Sampurna',
    price: 1999,
    currency: 'INR',
    features: [
      'Everything in Suraksha',
      'Weekly deep check-in call',
      'Doctor-ready reports (PDF)',
      'Priority support',
      'Unlimited family members',
    ],
  },
];

export const FREE_TRIAL_DAYS = 7;
export const GRACE_PERIOD_DAYS = 3;
