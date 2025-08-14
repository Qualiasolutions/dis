import { Button, Group } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../../stores/languageStore'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    setLanguage(newLanguage)
  }

  return (
    <Group>
      <Button
        variant={language === 'ar' ? 'filled' : 'subtle'}
        size="sm"
        onClick={() => handleLanguageChange('ar')}
      >
        {t('language.arabic')}
      </Button>
      <Button
        variant={language === 'en' ? 'filled' : 'subtle'}
        size="sm"
        onClick={() => handleLanguageChange('en')}
      >
        {t('language.english')}
      </Button>
    </Group>
  )
}