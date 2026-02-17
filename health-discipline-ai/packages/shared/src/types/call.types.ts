import { CallStatus } from '../enums';

export interface MedicineCheck {
  medicineId: string;
  medicineName: string;
  nickname: string;
  response: 'taken' | 'missed' | 'unclear' | 'pending';
  timestamp: Date;
}

export interface Vitals {
  glucose?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  capturedAt: Date;
}

export interface Call {
  _id: string;
  patientId: string;
  userId: string;
  scheduledAt: Date;
  initiatedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  status: CallStatus;
  retryCount: number;
  isRetry: boolean;
  originalCallId?: string;
  medicinesChecked: MedicineCheck[];
  vitals?: Vitals;
  moodNotes?: string;
  complaints?: string[];
  twilioCallSid?: string;
  elevenlabsConversationId?: string;
  voiceStack?: 'elevenlabs' | 'sarvam';
  livekitRoomName?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  transcript?: Array<{ role: string; message: string; timestamp?: Date }>;
  twilioCharges?: number;
  elevenlabsCharges?: number;
  elevenlabsCostCredits?: number;
  totalCharges?: number;
  terminationReason?: string;
  isFirstCall: boolean;
  usedNewPatientProtocol: boolean;
  conversationVariant?: string;
  toneUsed?: string;
  relationshipStage?: string;
  screeningQuestionsAsked?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CallResponse extends Call {}

export interface AdherenceResponse {
  date: string;
  totalMedicines: number;
  taken: number;
  missed: number;
  pending: number;
  adherencePercentage: number;
  medicineDetails: {
    medicineId: string;
    name: string;
    nickname: string;
    status: string;
    timing: string;
  }[];
  lastCallAt?: Date;
  nextCallAt?: Date;
}
