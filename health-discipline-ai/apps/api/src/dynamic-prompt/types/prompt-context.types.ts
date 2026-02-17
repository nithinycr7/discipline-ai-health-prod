export enum ConversationVariant {
  STANDARD = 'standard',
  WELLNESS_FIRST = 'wellness_first',
  QUICK_CHECK = 'quick_check',
  CELEBRATION = 'celebration',
  GENTLE_REENGAGEMENT = 'gentle_reengagement',
}

export enum ToneDirective {
  WARM_CHEERFUL = 'warm_cheerful',
  GENTLE_CONCERNED = 'gentle_concerned',
  CELEBRATORY_PROUD = 'celebratory_proud',
  LIGHT_BREEZY = 'light_breezy',
  REASSURING_PATIENT = 'reassuring_patient',
  FESTIVE_JOYFUL = 'festive_joyful',
}

export enum RelationshipStage {
  STRANGER = 'stranger',
  ACQUAINTANCE = 'acquaintance',
  FAMILIAR = 'familiar',
  TRUSTED = 'trusted',
  FAMILY = 'family',
}

export interface PatientCallContext {
  // Yesterday's call data (aggregated across all calls that day)
  yesterdayMood: string | null;
  yesterdayComplaints: string[];
  yesterdayMedicinesTaken: number;
  yesterdayMedicinesTotal: number;

  // Adherence
  currentStreak: number;
  adherence14Day: number; // percentage 0-100
  isStreakMilestone: boolean;
  streakMilestoneValue: number | null;

  // Mood trend (last 5 completed calls)
  recentMoods: string[];

  // Recent complaints (last 5 completed calls)
  recentComplaints: string[];

  // Engagement signals
  callsCompletedCount: number;
  recentMissedCalls: number; // no_answer/busy in last 7 days
  fatigueScore: number;

  // Patient info (passed through for convenience)
  patientName: string;
  isNewPatient: boolean;
  preferredLanguage: string;
  healthConditions: string[];
}

export interface DynamicPromptResult {
  variant: ConversationVariant;
  tone: ToneDirective;
  relationshipStage: RelationshipStage;
  flowDirective: string;
  toneDirectiveText: string;
  contextNotes: string;
  relationshipDirective: string;
  firstMessage: string;
  screeningQuestions: string;
  screeningQuestionIds: string[]; // e.g. ['diabetes_glucose', 'hypertension_bp'] for tracking
}

// --- Screening Questions Schedule ---

export interface ScreeningQuestion {
  id: string;
  condition: string;
  question: string;
  days: string[]; // 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  dataType: string;
}

export const SCREENING_SCHEDULE: ScreeningQuestion[] = [
  {
    id: 'diabetes_glucose',
    condition: 'diabetes',
    question: 'What was your fasting sugar reading today?',
    days: ['mon', 'thu'],
    dataType: 'number_mgdl',
  },
  {
    id: 'diabetes_hypo',
    condition: 'diabetes',
    question: 'Did you feel shaky, sweaty, or dizzy this week?',
    days: ['fri'],
    dataType: 'yes_no',
  },
  {
    id: 'hypertension_bp',
    condition: 'hypertension',
    question: 'What was your BP this morning?',
    days: ['tue', 'sat'],
    dataType: 'systolic_diastolic',
  },
  {
    id: 'hypertension_dizzy',
    condition: 'hypertension',
    question: 'Any headache or dizziness when standing up?',
    days: ['wed'],
    dataType: 'yes_no',
  },
  {
    id: 'heart_disease_chest',
    condition: 'heart_disease',
    question: 'Any chest pain or heaviness this week?',
    days: ['mon'],
    dataType: 'yes_no',
  },
  {
    id: 'heart_disease_breath',
    condition: 'heart_disease',
    question: 'Can you walk around without getting breathless?',
    days: ['thu'],
    dataType: 'better_same_worse',
  },
  {
    id: 'heart_failure_edema',
    condition: 'heart_failure',
    question: 'Are your feet or ankles swollen?',
    days: ['mon', 'fri'],
    dataType: 'yes_no',
  },
  {
    id: 'thyroid_timing',
    condition: 'thyroid',
    question: 'Did you take your thyroid medicine 30 minutes before food, on an empty stomach?',
    days: ['tue'],
    dataType: 'yes_no',
  },
  {
    id: 'cholesterol_muscle',
    condition: 'cholesterol',
    question: 'Any muscle pain or body aches?',
    days: ['wed'],
    dataType: 'yes_no',
  },
  {
    id: 'arthritis_joints',
    condition: 'arthritis',
    question: 'How are your joints — better, same, or worse?',
    days: ['mon'],
    dataType: 'better_same_worse',
  },
  {
    id: 'copd_asthma_breathing',
    condition: 'copd_asthma',
    question: 'Any wheezing or breathing trouble this week?',
    days: ['thu'],
    dataType: 'yes_no',
  },
  {
    id: 'kidney_disease_swelling',
    condition: 'kidney_disease',
    question: 'Any swelling on your face or feet?',
    days: ['fri'],
    dataType: 'yes_no',
  },
  {
    id: 'depression_mood',
    condition: 'depression',
    question: 'How has your mood been? Did you go outside or talk to someone this week?',
    days: ['sun'],
    dataType: 'good_okay_low',
  },
];

export const STREAK_MILESTONES = [7, 14, 21, 30, 60, 100] as const;
