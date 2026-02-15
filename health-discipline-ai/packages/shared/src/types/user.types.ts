import { UserRole } from '../enums';

export interface NotificationPreferences {
  weekly: boolean;
  daily: boolean;
  alerts: boolean;
}

export interface User {
  _id: string;
  phone?: string;
  email?: string;
  name: string;
  role: UserRole;
  location?: string;
  timezone: string;
  relationshipToPatient?: string;
  notificationPreferences: NotificationPreferences;
  health_onboarding_step?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  phone?: string;
  email?: string;
  password?: string;
  name: string;
  role: UserRole;
  location?: string;
  timezone: string;
  relationshipToPatient?: string;
}

export interface UserResponse extends Omit<User, 'password'> {}
