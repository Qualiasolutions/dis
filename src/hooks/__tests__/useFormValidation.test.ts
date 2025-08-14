import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFormValidation } from '../useFormValidation'

// Mock useTranslation
const mockT = (key: string) => {
  const translations: { [key: string]: string } = {
    'validation.name_required': 'Name is required',
    'validation.phone_required': 'Phone number is required',
    'validation.phone_invalid': 'Invalid phone number. Please use format: 07XXXXXXXX',
    'validation.email_invalid': 'Invalid email address',
    'validation.vehicle_type_required': 'Vehicle type is required',
    'validation.budget_required': 'Budget range is required',
  }
  return translations[key] || key
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}))

describe('useFormValidation', () => {
  it('should validate Jordan phone numbers correctly', () => {
    const { result } = renderHook(() => useFormValidation())
    
    // Valid Jordan numbers
    expect(result.current.validateJordanPhone('0791234567')).toBeNull()
    expect(result.current.validateJordanPhone('0781234567')).toBeNull()
    expect(result.current.validateJordanPhone('0791234567')).toBeNull()
    expect(result.current.validateJordanPhone('+9627912345678')).toBeNull()
    
    // Invalid numbers
    expect(result.current.validateJordanPhone('')).toBe('Phone number is required')
    expect(result.current.validateJordanPhone('0612345678')).toBe('Invalid phone number. Please use format: 07XXXXXXXX')
    expect(result.current.validateJordanPhone('1234567890')).toBe('Invalid phone number. Please use format: 07XXXXXXXX')
    expect(result.current.validateJordanPhone('079123456')).toBe('Invalid phone number. Please use format: 07XXXXXXXX')
  })

  it('should format Jordan phone numbers correctly', () => {
    const { result } = renderHook(() => useFormValidation())
    
    expect(result.current.formatJordanPhone('0791234567')).toBe('079 1234 567')
    expect(result.current.formatJordanPhone('9627912345678')).toBe('079 1234 567')
    expect(result.current.formatJordanPhone('079 123 456')).toBe('079 123 456')
  })

  it('should validate names correctly', () => {
    const { result } = renderHook(() => useFormValidation())
    
    expect(result.current.validateName('John Doe')).toBeNull()
    expect(result.current.validateName('أحمد محمد')).toBeNull()
    expect(result.current.validateName('')).toBe('Name is required')
    expect(result.current.validateName('  ')).toBe('Name is required')
    expect(result.current.validateName('J')).toBe('Name must be at least 2 characters')
  })

  it('should validate emails correctly', () => {
    const { result } = renderHook(() => useFormValidation())
    
    expect(result.current.validateEmail('user@example.com')).toBeNull()
    expect(result.current.validateEmail('')).toBeNull() // Email is optional
    expect(result.current.validateEmail('invalid-email')).toBe('Invalid email address')
    expect(result.current.validateEmail('user@')).toBe('Invalid email address')
  })
})