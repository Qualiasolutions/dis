import { useForm } from '@mantine/form'
import { useTranslation } from 'react-i18next'
import {
  Paper,
  Title,
  TextInput,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  LoadingOverlay,
  Badge,
  Text,
  Divider,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState, useEffect } from 'react'
import { IconCheck, IconClock, IconWifiOff } from '@tabler/icons-react'
import { createVisit, queueVisitForSync } from '../../lib/supabase'
import { useFormValidation } from '../../hooks/useFormValidation'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { ConnectionStatus } from '../common/ConnectionStatus'

interface CustomerFormData {
  name: string
  phone: string
  email: string
  vehicleType: string
  budgetRange: string
  purchaseTimeline: string
  notes: string
}

export function CustomerIntakeForm() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { isOnline, isSyncing } = useConnectionStatus()
  const { validateName, validateJordanPhone, validateEmail, validateRequired, formatJordanPhone } = useFormValidation()

  const form = useForm<CustomerFormData>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      vehicleType: '',
      budgetRange: '',
      purchaseTimeline: '',
      notes: '',
    },
    validate: {
      name: validateName,
      phone: validateJordanPhone,
      email: validateEmail,
      vehicleType: (value) => validateRequired(value, 'vehicle_type'),
      budgetRange: (value) => validateRequired(value, 'budget'),
    },
    transformValues: (values) => ({
      ...values,
      // Clean and format phone number for storage
      phone: values.phone.replace(/[\s\-\(\)]/g, ''),
    }),
  })

  const vehicleTypeOptions = [
    { value: 'sedan', label: t('vehicle_types.sedan') },
    { value: 'suv', label: t('vehicle_types.suv') },
    { value: 'hatchback', label: t('vehicle_types.hatchback') },
    { value: 'coupe', label: t('vehicle_types.coupe') },
    { value: 'pickup', label: t('vehicle_types.pickup') },
    { value: 'van', label: t('vehicle_types.van') },
    { value: 'luxury', label: t('vehicle_types.luxury') },
    { value: 'sports', label: t('vehicle_types.sports') },
  ]

  const budgetRangeOptions = [
    { value: 'under_10k', label: t('budget_ranges.under_10k') },
    { value: '10k_20k', label: t('budget_ranges.10k_20k') },
    { value: '20k_30k', label: t('budget_ranges.20k_30k') },
    { value: '30k_50k', label: t('budget_ranges.30k_50k') },
    { value: '50k_100k', label: t('budget_ranges.50k_100k') },
    { value: 'over_100k', label: t('budget_ranges.over_100k') },
  ]

  const purchaseTimelineOptions = [
    { value: 'immediately', label: t('purchase_timeline.immediately') },
    { value: 'within_week', label: t('purchase_timeline.within_week') },
    { value: 'within_month', label: t('purchase_timeline.within_month') },
    { value: 'within_3months', label: t('purchase_timeline.within_3months') },
    { value: 'within_6months', label: t('purchase_timeline.within_6months') },
    { value: 'just_looking', label: t('purchase_timeline.just_looking') },
  ]

  // Auto-format phone number as user types
  const handlePhoneChange = (value: string) => {
    const formatted = formatJordanPhone(value)
    form.setFieldValue('phone', formatted)
  }

  const handleSubmit = async (values: CustomerFormData) => {
    setLoading(true)
    
    try {
      const visitData = {
        customerName: values.name.trim(),
        customerPhone: values.phone,
        customerEmail: values.email?.trim() || undefined,
        vehicleType: values.vehicleType,
        budgetRange: values.budgetRange,
        purchaseTimeline: values.purchaseTimeline || 'just_looking',
        notes: values.notes?.trim() || undefined,
      }

      if (isOnline) {
        // Try to create visit directly
        await createVisit(visitData)
        
        notifications.show({
          title: t('status.success'),
          message: t('messages.form_submitted'),
          color: 'green',
          icon: <IconCheck size={16} />,
        })
      } else {
        // Queue for offline sync
        queueVisitForSync(visitData)
        
        notifications.show({
          title: t('status.saved'),
          message: t('messages.form_saved_offline'),
          color: 'blue',
          icon: <IconClock size={16} />,
        })
      }
      
      form.reset()
      
    } catch (error) {
      console.error('Form submission error:', error)
      
      // If online submission fails, queue for retry
      if (isOnline) {
        const visitData = {
          customerName: values.name.trim(),
          customerPhone: values.phone,
          customerEmail: values.email?.trim() || undefined,
          vehicleType: values.vehicleType,
          budgetRange: values.budgetRange,
          purchaseTimeline: values.purchaseTimeline || 'just_looking',
          notes: values.notes?.trim() || undefined,
        }
        
        queueVisitForSync(visitData)
        
        notifications.show({
          title: t('status.error'),
          message: t('messages.form_saved_offline'),
          color: 'orange',
          icon: <IconWifiOff size={16} />,
        })
      } else {
        notifications.show({
          title: t('status.error'),
          message: t('messages.sync_error'),
          color: 'red',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConnectionStatus />
      
      <div className="intake-form">
        <Paper p="xl" shadow="sm" radius="md" pos="relative">
          <LoadingOverlay visible={loading || isSyncing} />
          
          <Group justify="space-between" align="center" mb="xl">
            <Title order={2}>
              {t('form.customer_info')}
            </Title>
            
            <Badge
              color={isOnline ? 'green' : 'orange'}
              variant="light"
              leftSection={isOnline ? <IconCheck size={12} /> : <IconWifiOff size={12} />}
            >
              {isOnline ? t('status.online') : t('status.offline')}
            </Badge>
          </Group>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label={t('form.name')}
                placeholder={t('form.name')}
                required
                size="md"
                {...form.getInputProps('name')}
                description={t('form.required')}
              />

              <TextInput
                label={t('form.phone')}
                placeholder="07X XXXX XXX"
                required
                size="md"
                onChange={(event) => handlePhoneChange(event.currentTarget.value)}
                value={form.values.phone}
                error={form.errors.phone}
                description="Format: 07X XXXX XXX"
                dir="ltr" // Phone numbers should be LTR even in Arabic
              />

              <TextInput
                label={t('form.email')}
                placeholder="customer@example.com"
                size="md"
                {...form.getInputProps('email')}
                description={t('form.optional')}
                type="email"
              />

              <Divider 
                label={t('form.vehicle_interest')} 
                labelPosition="center" 
                my="md"
              />

              <Select
                label={t('form.vehicle_type')}
                placeholder={t('form.vehicle_type')}
                required
                size="md"
                data={vehicleTypeOptions}
                {...form.getInputProps('vehicleType')}
                searchable
                description={t('form.required')}
              />

              <Group grow>
                <Select
                  label={t('form.budget_range')}
                  placeholder={t('form.budget_range')}
                  required
                  size="md"
                  data={budgetRangeOptions}
                  {...form.getInputProps('budgetRange')}
                />

                <Select
                  label={t('form.purchase_timeline')}
                  placeholder={t('form.purchase_timeline')}
                  size="md"
                  data={purchaseTimelineOptions}
                  {...form.getInputProps('purchaseTimeline')}
                />
              </Group>

              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notes')}
                minRows={3}
                maxRows={6}
                size="md"
                {...form.getInputProps('notes')}
                description={t('form.optional')}
              />

              <Group justify="center" mt="xl">
                <Button 
                  type="submit" 
                  size="lg" 
                  loading={loading}
                  disabled={!form.isValid() || isSyncing}
                  leftSection={
                    isOnline ? <IconCheck size={16} /> : <IconClock size={16} />
                  }
                >
                  {isOnline ? t('form.submit') : t('form.save')}
                </Button>
              </Group>

              {!isOnline && (
                <Text size="sm" c="dimmed" ta="center" mt="xs">
                  {t('messages.form_saved_offline')}
                </Text>
              )}
            </Stack>
          </form>
        </Paper>
      </div>
    </>
  )
}