import { useTranslation } from 'react-i18next'

export const useFormValidation = () => {
  const { t } = useTranslation()

  const validateName = (value: string): string | null => {
    if (!value?.trim()) return t('validation.name_required')
    if (value.length < 2) return 'Name must be at least 2 characters'
    if (value.length > 100) return 'Name must be less than 100 characters'
    return null
  }

  const validateJordanPhone = (value: string): string | null => {
    if (!value?.trim()) return t('validation.phone_required')
    
    // Remove all spaces, dashes, and parentheses
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '')
    
    // Check for Jordan mobile format: 07X XXXXXXX
    const jordanMobileRegex = /^07[789]\d{7}$/
    
    // Also accept international format: +962 7X XXX XXXX
    const jordanIntlRegex = /^(\+962|00962)7[789]\d{7}$/
    
    if (!jordanMobileRegex.test(cleanPhone) && !jordanIntlRegex.test(cleanPhone)) {
      return t('validation.phone_invalid')
    }
    
    return null
  }

  const validateEmail = (value?: string): string | null => {
    if (!value?.trim()) return null // Email is optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return t('validation.email_invalid')
    }
    
    return null
  }

  const validateRequired = (value: string, fieldName: string): string | null => {
    if (!value?.trim()) {
      return t(`validation.${fieldName}_required`)
    }
    return null
  }

  const formatJordanPhone = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with 962, remove it
    const cleanDigits = digits.startsWith('962') ? digits.slice(3) : digits
    
    // Format as 07X XXXX XXX
    if (cleanDigits.length >= 3) {
      let formatted = cleanDigits.slice(0, 3)
      if (cleanDigits.length >= 7) {
        formatted += ' ' + cleanDigits.slice(3, 7)
        if (cleanDigits.length >= 10) {
          formatted += ' ' + cleanDigits.slice(7, 10)
        } else if (cleanDigits.length > 7) {
          formatted += ' ' + cleanDigits.slice(7)
        }
      } else if (cleanDigits.length > 3) {
        formatted += ' ' + cleanDigits.slice(3)
      }
      return formatted
    }
    
    return cleanDigits
  }

  return {
    validateName,
    validateJordanPhone,
    validateEmail,
    validateRequired,
    formatJordanPhone,
  }
}