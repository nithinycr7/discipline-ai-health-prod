import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAdherenceColor(percentage: number): string {
  if (percentage >= 100) return 'text-success';
  if (percentage >= 50) return 'text-warning';
  return 'text-destructive';
}

export function getAdherenceBgColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-100 dark:bg-green-900/20';
  if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
  if (percentage > 0) return 'bg-red-100 dark:bg-red-900/20';
  return 'bg-gray-100 dark:bg-gray-800';
}

export function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith('+91')) {
    const digits = phone.slice(3);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}
