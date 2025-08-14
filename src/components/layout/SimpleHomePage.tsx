import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button, Card, Text, Stack } from '@mantine/core'
import { IconLogin } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { TahboubLogo } from '../common/TahboubLogo'

export function SimpleHomePage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    // Show welcome message for authenticated users
    return (
      <div className="min-h-screen flex items-center justify-center bg-dealership-light">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="p-8 text-center">
            <Stack gap="lg">
              <div className="mx-auto w-20 h-16 flex items-center justify-center">
                <TahboubLogo size={64} />
              </div>
              
              <div>
                <Text size="xl" fw={700} className="text-dealership-black mb-2">
                  {t('welcome')} {user.name || user.email}
                </Text>
                <Text size="sm" className="text-dealership-dark-text">
                  {t('Choose your workspace')}
                </Text>
              </div>

              <Stack gap="sm">
                <Button
                  component={Link}
                  to="/queue"
                  variant="filled"
                  color="dealership"
                  size="md"
                  fullWidth
                  leftSection={<IconLogin size={18} />}
                >
                  {t('Enter System')}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Show sign-in prompt for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-dealership-light">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full mx-4"
      >
        <Card className="p-8 text-center">
          <Stack gap="lg">
            <div className="mx-auto w-24 h-20 flex items-center justify-center">
              <TahboubLogo size={80} />
            </div>
            
            <div>
              <Text size="xl" fw={700} className="text-dealership-black mb-2">
                {t('Tahboub Automotive')}
              </Text>
              <Text size="sm" className="text-dealership-dark-text">
                {t('Dealership Management System')}
              </Text>
            </div>

            <Stack gap="sm">
              <Button
                component={Link}
                to="/auth"
                variant="filled"
                color="dealership"
                size="lg"
                fullWidth
                leftSection={<IconLogin size={20} />}
              >
                {t('Sign In')}
              </Button>
              
              <Text size="xs" className="text-dealership-text">
                {t('Internal use only - Authorized personnel')}
              </Text>
            </Stack>
          </Stack>
        </Card>
      </motion.div>
    </div>
  )
}