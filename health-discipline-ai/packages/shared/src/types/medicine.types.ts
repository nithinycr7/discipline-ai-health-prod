import { MedicineTiming, FoodPreference } from '../enums';

export interface Medicine {
  _id: string;
  patientId: string;
  brandName: string;
  genericName?: string;
  dosage?: string;
  timing: MedicineTiming;
  foodPreference: FoodPreference;
  nicknames: string[];
  linkedCondition?: string;
  isCritical: boolean;
  catalogId?: string;
  needsReview: boolean;
  reviewedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicineDto {
  brandName: string;
  genericName?: string;
  dosage?: string;
  timing: MedicineTiming;
  foodPreference: FoodPreference;
  nicknames: string[];
  linkedCondition?: string;
  isCritical: boolean;
}

export interface UpdateMedicineDto extends Partial<CreateMedicineDto> {
  isActive?: boolean;
}

export interface MedicineResponse extends Medicine {}

export interface MedicineCatalog {
  _id: string;
  brandName: string;
  genericName: string;
  category: string;
  linkedConditions: string[];
  isCombination: boolean;
  components?: string[];
  commonDosages: string[];
  aliases: string[];
}

export interface MedicineSuggestion {
  brandName: string;
  genericName: string;
  linkedConditions: string[];
  similarity?: number;
}
