// Export all types for easy importing
export * from './customer';
export * from './consultant'; 
export * from './visit';
export * from './api';

// Jordan-specific validation patterns
export const JORDAN_PHONE_REGEX = /^07[789]\d{7}$/;
export const JORDAN_PHONE_INTERNATIONAL = (phone: string): string => {
  if (phone.startsWith('07')) {
    return '962' + phone.substring(1);
  }
  return phone;
};

// Language utilities
export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Utility types
export interface DateRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  status?: string[];
  consultant_id?: string;
  date_range?: DateRange;
  language?: SupportedLanguage;
}