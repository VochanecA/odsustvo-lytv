// app/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotal = startHour + startMinute / 60;
  const endTotal = endHour + endMinute / 60;
  
  return Math.max(0, endTotal - startTotal);
}

export function getMonthDays(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
}

export function getAbsenceColor(typeId: string): string {
  const colors: Record<string, string> = {
    'V': 'bg-green-500',
    'S': 'bg-purple-500',
    'B': 'bg-red-500',
    'D': 'bg-gray-500',
    'C': 'bg-yellow-500',
  };
  
  return colors[typeId] || 'bg-blue-500';
}