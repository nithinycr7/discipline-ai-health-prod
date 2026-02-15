import { PlanInfo } from '../types';

export const SUBSCRIPTION_PLANS: PlanInfo[] = [
  {
    id: 'suraksha',
    name: 'Suraksha',
    price: 1350,
    currency: 'INR',
    features: [
      '1 call daily (7 days)',
      'Real-time alerts for missed medicines',
      'Up to 3 family members',
      'Daily & weekly reports',
      'Vitals tracking (if available)',
    ],
  },
  {
    id: 'sampurna',
    name: 'Sampurna',
    price: 1800,
    currency: 'INR',
    popular: true,
    features: [
      '2 calls daily (7 days)',
      'Weekly deep check-in call',
      'Doctor-ready reports (PDF)',
      'Priority support',
      'Unlimited family members',
    ],
  },
];

export const FREE_TRIAL_DAYS = 7;
export const GRACE_PERIOD_DAYS = 3;
