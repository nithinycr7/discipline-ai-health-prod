import { SubscriptionStatus } from '../enums';

export interface Patient {
  _id: string;
  userId: string;
  authorizedUsers: string[];
  fullName: string;
  preferredName: string;
  age: number;
  phone: string;
  preferredLanguage: string;
  digitalTier: number;
  healthConditions: string[];
  hasGlucometer: boolean;
  hasBPMonitor: boolean;
  preferredVoiceGender: 'male' | 'female';
  isPaused: boolean;
  pauseReason?: string;
  pausedUntil?: Date;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date;
  callsCompletedCount: number;
  isNewPatient: boolean;
  firstCallAt?: Date;
  lastCallAt?: Date;
  phoneStatus?: 'valid' | 'invalid';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientDto {
  fullName: string;
  preferredName: string;
  age: number;
  phone: string;
  preferredLanguage: string;
  digitalTier: number;
  healthConditions: string[];
  hasGlucometer: boolean;
  hasBPMonitor: boolean;
  preferredVoiceGender: 'male' | 'female';
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  isPaused?: boolean;
  pauseReason?: string;
  pausedUntil?: Date;
}

export interface PatientResponse extends Patient {}
