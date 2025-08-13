export interface Customer {
  id: string;
  phone: string; // Jordan format: 07XXXXXXXX - primary deduplication key
  name: string;
  email?: string;
  language_preference: 'ar' | 'en'; // Drives UI/communication language
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  phone: string;
  name: string;
  email?: string;
  language_preference: 'ar' | 'en';
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  language_preference?: 'ar' | 'en';
}