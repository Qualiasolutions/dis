import { useForm } from '@mantine/form'
import { useTranslation } from 'react-i18next'
import {
  Paper,
  Title,
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  LoadingOverlay,
  Badge,
  Text,
  Divider,
  Card,
  Progress,
  Stepper,
  ThemeIcon,
  Timeline,
  Avatar,
  Tooltip,
  ActionIcon,
  NumberInput,
  Checkbox,
  Radio,
  SegmentedControl,
  Slider,
  Switch,
  Alert,
  Collapse,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState, useEffect, useRef } from 'react'
import { 
  IconCheck, 
  IconClock, 
  IconWifiOff,
  IconUser,
  IconPhone,
  IconMail,
  IconCar,
  IconCash,
  IconCalendar,
  IconNotes,
  IconSparkles,
  IconBolt,
  IconStar,
  IconBrandWhatsapp,
  IconMapPin,
  IconGauge,
  IconEngine,
  IconColorSwatch,
  IconInfoCircle,
  IconArrowRight,
  IconArrowLeft,
} from '@tabler/icons-react'
import { createVisit, queueVisitForSync } from '../../lib/supabase'
import { useFormValidation } from '../../hooks/useFormValidation'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { ConnectionStatus } from '../common/ConnectionStatus'
import { TahboubLogo } from '../common/TahboubLogo'
import { AnimatedButton } from '../buttons/AnimatedButton'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRevealOnScroll, useFadeIn } from '../../hooks/useGSAPAnimation'
import { animationUtils } from '../../utils/animations'

interface CustomerFormData {
  // Basic Info
  name: string
  phone: string
  email: string
  preferredContact: string
  // Vehicle Preferences
  vehicleType: string
  budgetRange: string
  purchaseTimeline: string
  // Additional Preferences
  fuelType: string
  transmissionType: string
  color: string
  features: string[]
  tradeIn: boolean
  financing: boolean
  // Other
  source: string
  notes: string
  // Engagement
  rating: number
  newsletterSubscribe: boolean
}

const vehicleFeatures = [
  { value: 'sunroof', label: '🌞 Sunroof' },
  { value: 'leather', label: '🪑 Leather Seats' },
  { value: 'navigation', label: '🗺️ Navigation' },
  { value: 'bluetooth', label: '📱 Bluetooth' },
  { value: 'camera', label: '📷 Backup Camera' },
  { value: 'sensors', label: '🚨 Parking Sensors' },
  { value: 'cruise', label: '🚗 Cruise Control' },
  { value: 'keyless', label: '🔑 Keyless Entry' },
]

export function CustomerIntakeForm() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { isOnline, isSyncing } = useConnectionStatus()
  const { validateName, validateJordanPhone, validateEmail, validateRequired, formatJordanPhone } = useFormValidation()
  const isRTL = i18n.language === 'ar'
  
  // Refs for animations
  const formRef = useRef<HTMLDivElement>(null)
  const headerRef = useFadeIn(0.3, 0.8)
  const stepsRef = useRevealOnScroll()
  
  const form = useForm<CustomerFormData>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      preferredContact: 'phone',
      vehicleType: '',
      budgetRange: '',
      purchaseTimeline: '',
      fuelType: 'petrol',
      transmissionType: 'automatic',
      color: '',
      features: [],
      tradeIn: false,
      financing: false,
      source: 'walk-in',
      notes: '',
      rating: 3,
      newsletterSubscribe: true,
    },
    validate: {
      name: validateName,
      phone: validateJordanPhone,
      email: (value) => value ? validateEmail(value) : null,
      vehicleType: validateRequired,
      budgetRange: validateRequired,
    },
    transformValues: (values) => ({
      ...values,
      phone: formatJordanPhone(values.phone),
    }),
  })

  // Animate form on mount
  useGSAP(() => {
    if (!formRef.current) return
    
    const tl = gsap.timeline()
    
    // Animate form sections
    tl.fromTo('.form-section',
      { 
        opacity: 0,
        y: 30,
        scale: 0.98
      },
      { 
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }
    )
  }, { scope: formRef })

  const handleSubmit = async (values: CustomerFormData) => {
    setLoading(true)
    
    // Animate submit button
    const submitButton = document.querySelector('.submit-button')
    if (submitButton) {
      gsap.to(submitButton, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      })
    }
    
    try {
      const visitData = {
        customer_name: values.name,
        customer_phone: values.phone,
        customer_email: values.email || null,
        vehicle_type: values.vehicleType,
        budget_range: values.budgetRange,
        purchase_timeline: values.purchaseTimeline,
        notes: values.notes || null,
        status: 'new',
        source: values.source,
        additional_data: {
          fuelType: values.fuelType,
          transmissionType: values.transmissionType,
          color: values.color,
          features: values.features,
          tradeIn: values.tradeIn,
          financing: values.financing,
          rating: values.rating,
          newsletterSubscribe: values.newsletterSubscribe,
          preferredContact: values.preferredContact,
        }
      }

      if (isOnline) {
        await createVisit(visitData)
        
        // Success animation
        gsap.to(formRef.current, {
          scale: 0.98,
          opacity: 0.5,
          duration: 0.3,
          onComplete: () => {
            gsap.to(formRef.current, {
              scale: 1,
              opacity: 1,
              duration: 0.3,
            })
          }
        })
        
        notifications.show({
          title: t('messages.form_submitted'),
          message: t('dashboard.customerAdded', 'Customer has been added to the system'),
          color: 'green',
          icon: <IconCheck />,
        })
      } else {
        await queueVisitForSync(visitData)
        notifications.show({
          title: t('messages.form_saved_offline'),
          message: t('messages.sync_when_online', 'Data will sync when connection is restored'),
          color: 'yellow',
          icon: <IconWifiOff />,
        })
      }
      
      form.reset()
      setActive(0)
    } catch (error) {
      // Error shake animation
      gsap.to(formRef.current, {
        x: [0, -10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power2.out"
      })
      
      console.error('Error creating visit:', error)
      notifications.show({
        title: t('status.error'),
        message: t('messages.sync_error'),
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (active === 0) {
      // Validate basic info
      const errors = form.validateField('name')
      const phoneErrors = form.validateField('phone')
      if (errors.hasError || phoneErrors.hasError) return
    }
    
    if (active === 1) {
      // Validate vehicle preferences
      const typeErrors = form.validateField('vehicleType')
      const budgetErrors = form.validateField('budgetRange')
      if (typeErrors.hasError || budgetErrors.hasError) return
    }
    
    setActive((current) => (current < 3 ? current + 1 : current))
  }

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

  // Calculate form completion percentage
  const completionPercentage = Math.round((Object.values(form.values).filter(v => v).length / Object.keys(form.values).length) * 100)

  return (
    <Paper ref={formRef} shadow="lg" radius="lg" p="xl" className="max-w-4xl mx-auto">
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <div ref={headerRef} className="text-center mb-8">
        <Group justify="center" mb="md">
          <TahboubLogo size={64} className="drop-shadow-md" />
        </Group>
        <Title order={2} className="flex items-center justify-center gap-3 text-dealership-black">
          <IconSparkles size={28} className="text-yellow-500" />
          {t('form.customer_info')}
        </Title>
        <Text c="dimmed" size="sm" mt="xs">
          {t('dashboard.fillDetails', 'Fill in customer details to get started')}
        </Text>
      </div>

      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Progress Bar */}
      <Card className="mb-6 shadow-clean" p="sm">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>{t('dashboard.formProgress', 'Form Progress')}</Text>
          <Badge color="blue" variant="light">{completionPercentage}%</Badge>
        </Group>
        <Progress value={completionPercentage} size="lg" radius="xl" striped animated />
      </Card>

      {/* Stepper */}
      <div ref={stepsRef}>
        <Stepper active={active} onStepClick={setActive} className="mb-8">
          <Stepper.Step 
            label={t('dashboard.basicInfo', 'Basic Info')}
            description={t('dashboard.contactDetails', 'Contact details')}
            icon={<IconUser size={18} />}
          >
            <div className="form-section">
              <Stack gap="md">
                <TextInput
                  label={t('form.name')}
                  placeholder={t('dashboard.enterFullName', 'Enter full name')}
                  leftSection={<IconUser size={18} />}
                  required
                  {...form.getInputProps('name')}
                />
                
                <Group grow>
                  <TextInput
                    label={t('form.phone')}
                    placeholder="07XXXXXXXX"
                    leftSection={<IconPhone size={18} />}
                    rightSection={
                      <Tooltip label="WhatsApp">
                        <ActionIcon variant="subtle" color="green">
                          <IconBrandWhatsapp size={16} />
                        </ActionIcon>
                      </Tooltip>
                    }
                    required
                    {...form.getInputProps('phone')}
                  />
                  
                  <TextInput
                    label={t('form.email')}
                    placeholder="email@example.com"
                    leftSection={<IconMail size={18} />}
                    {...form.getInputProps('email')}
                  />
                </Group>
                
                <SegmentedControl
                  value={form.values.preferredContact}
                  onChange={(value) => form.setFieldValue('preferredContact', value)}
                  data={[
                    { label: t('dashboard.phone', 'Phone'), value: 'phone' },
                    { label: t('dashboard.email', 'Email'), value: 'email' },
                    { label: t('dashboard.whatsapp', 'WhatsApp'), value: 'whatsapp' },
                  ]}
                />
              </Stack>
            </div>
          </Stepper.Step>

          <Stepper.Step 
            label={t('vehicle.interest')}
            description={t('dashboard.preferences', 'Preferences')}
            icon={<IconCar size={18} />}
          >
            <div className="form-section">
              <Stack gap="md">
                <Select
                  label={t('form.vehicle_type')}
                  placeholder={t('dashboard.selectVehicleType', 'Select vehicle type')}
                  leftSection={<IconCar size={18} />}
                  required
                  data={[
                    { value: 'sedan', label: `🚗 ${t('vehicle_types.sedan')}` },
                    { value: 'suv', label: `🚙 ${t('vehicle_types.suv')}` },
                    { value: 'hatchback', label: `🚗 ${t('vehicle_types.hatchback')}` },
                    { value: 'coupe', label: `🏎️ ${t('vehicle_types.coupe')}` },
                    { value: 'pickup', label: `🛻 ${t('vehicle_types.pickup')}` },
                    { value: 'van', label: `🚐 ${t('vehicle_types.van')}` },
                    { value: 'luxury', label: `🚘 ${t('vehicle_types.luxury')}` },
                    { value: 'sports', label: `🏁 ${t('vehicle_types.sports')}` },
                  ]}
                  {...form.getInputProps('vehicleType')}
                />
                
                <Select
                  label={t('form.budget_range')}
                  placeholder={t('dashboard.selectBudget', 'Select budget range')}
                  leftSection={<IconCash size={18} />}
                  required
                  data={[
                    { value: 'under_10k', label: t('budget_ranges.under_10k') },
                    { value: '10k_20k', label: t('budget_ranges.10k_20k') },
                    { value: '20k_30k', label: t('budget_ranges.20k_30k') },
                    { value: '30k_50k', label: t('budget_ranges.30k_50k') },
                    { value: '50k_100k', label: t('budget_ranges.50k_100k') },
                    { value: 'over_100k', label: t('budget_ranges.over_100k') },
                  ]}
                  {...form.getInputProps('budgetRange')}
                />
                
                <Select
                  label={t('form.purchase_timeline')}
                  placeholder={t('dashboard.selectTimeline', 'Select timeline')}
                  leftSection={<IconCalendar size={18} />}
                  data={[
                    { value: 'immediately', label: `⚡ ${t('purchase_timeline.immediately')}` },
                    { value: 'within_week', label: `📅 ${t('purchase_timeline.within_week')}` },
                    { value: 'within_month', label: `📆 ${t('purchase_timeline.within_month')}` },
                    { value: 'within_3months', label: `🗓️ ${t('purchase_timeline.within_3months')}` },
                    { value: 'within_6months', label: `📋 ${t('purchase_timeline.within_6months')}` },
                    { value: 'just_looking', label: `👀 ${t('purchase_timeline.just_looking')}` },
                  ]}
                  {...form.getInputProps('purchaseTimeline')}
                />
              </Stack>
            </div>
          </Stepper.Step>

          <Stepper.Step 
            label={t('dashboard.additionalInfo', 'Additional Info')}
            description={t('form.optional')}
            icon={<IconInfoCircle size={18} />}
          >
            <div className="form-section">
              <Stack gap="md">
                <Group grow>
                  <Select
                    label={t('dashboard.fuelType', 'Fuel Type')}
                    leftSection={<IconGauge size={18} />}
                    data={[
                      { value: 'petrol', label: '⛽ Petrol' },
                      { value: 'diesel', label: '🛢️ Diesel' },
                      { value: 'hybrid', label: '🔋 Hybrid' },
                      { value: 'electric', label: '⚡ Electric' },
                    ]}
                    {...form.getInputProps('fuelType')}
                  />
                  
                  <Select
                    label={t('dashboard.transmission', 'Transmission')}
                    leftSection={<IconEngine size={18} />}
                    data={[
                      { value: 'automatic', label: '🔄 Automatic' },
                      { value: 'manual', label: '🏁 Manual' },
                    ]}
                    {...form.getInputProps('transmissionType')}
                  />
                </Group>
                
                <TextInput
                  label={t('dashboard.preferredColor', 'Preferred Color')}
                  placeholder={t('dashboard.anyColor', 'Any color')}
                  leftSection={<IconColorSwatch size={18} />}
                  {...form.getInputProps('color')}
                />
                
                <div>
                  <Text size="sm" fw={500} mb="xs">{t('dashboard.desiredFeatures', 'Desired Features')}</Text>
                  <Checkbox.Group
                    value={form.values.features}
                    onChange={(value) => form.setFieldValue('features', value)}
                  >
                    <Group>
                      {vehicleFeatures.map((feature) => (
                        <Checkbox
                          key={feature.value}
                          value={feature.value}
                          label={feature.label}
                        />
                      ))}
                    </Group>
                  </Checkbox.Group>
                </div>
                
                <Group>
                  <Switch
                    label={t('dashboard.tradeIn', 'Has trade-in vehicle')}
                    {...form.getInputProps('tradeIn', { type: 'checkbox' })}
                  />
                  <Switch
                    label={t('dashboard.needsFinancing', 'Needs financing')}
                    {...form.getInputProps('financing', { type: 'checkbox' })}
                  />
                </Group>
              </Stack>
            </div>
          </Stepper.Step>

          <Stepper.Step 
            label={t('dashboard.finalDetails', 'Final Details')}
            description={t('dashboard.almostDone', 'Almost done!')}
            icon={<IconNotes size={18} />}
          >
            <div className="form-section">
              <Stack gap="md">
                <Select
                  label={t('dashboard.howDidYouHear', 'How did you hear about us?')}
                  leftSection={<IconMapPin size={18} />}
                  data={[
                    { value: 'walk-in', label: `🚶 ${t('common.walkIn')}` },
                    { value: 'online', label: '💻 Online' },
                    { value: 'social-media', label: '📱 Social Media' },
                    { value: 'referral', label: '👥 Referral' },
                    { value: 'advertisement', label: '📺 Advertisement' },
                    { value: 'other', label: '📝 Other' },
                  ]}
                  {...form.getInputProps('source')}
                />
                
                <TextInput
                  label={t('form.notes')}
                  placeholder={t('dashboard.additionalNotes', 'Any additional notes or special requests...')}
                  leftSection={<IconNotes size={18} />}
                  multiline
                  rows={4}
                  {...form.getInputProps('notes')}
                />
                
                <div>
                  <Text size="sm" fw={500} mb="xs">
                    {t('dashboard.experienceRating', 'How would you rate your experience so far?')}
                  </Text>
                  <Group>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <ActionIcon
                        key={rating}
                        variant={form.values.rating >= rating ? 'filled' : 'light'}
                        color="yellow"
                        onClick={() => form.setFieldValue('rating', rating)}
                      >
                        <IconStar size={20} />
                      </ActionIcon>
                    ))}
                  </Group>
                </div>
                
                <Checkbox
                  label={t('dashboard.newsletter', 'Subscribe to our newsletter for exclusive offers')}
                  {...form.getInputProps('newsletterSubscribe', { type: 'checkbox' })}
                />
              </Stack>
            </div>
          </Stepper.Step>

          <Stepper.Completed>
            <div className="text-center py-8">
              <ThemeIcon size={80} radius="xl" color="green" className="mx-auto mb-4">
                <IconCheck size={40} />
              </ThemeIcon>
              <Title order={3} mb="md">{t('dashboard.readyToSubmit', 'Ready to Submit!')}</Title>
              <Text c="dimmed" mb="xl">
                {t('dashboard.reviewAndSubmit', 'Please review your information and submit')}
              </Text>
              
              {/* Summary Card */}
              <Card className="text-left mb-6 shadow-clean">
                <Title order={5} mb="md">{t('dashboard.summary', 'Summary')}</Title>
                <Stack gap="xs">
                  <Group>
                    <IconUser size={16} />
                    <Text size="sm">{form.values.name || '-'}</Text>
                  </Group>
                  <Group>
                    <IconPhone size={16} />
                    <Text size="sm">{form.values.phone || '-'}</Text>
                  </Group>
                  <Group>
                    <IconCar size={16} />
                    <Text size="sm">{t(`vehicle_types.${form.values.vehicleType}`) || '-'}</Text>
                  </Group>
                  <Group>
                    <IconCash size={16} />
                    <Text size="sm">{t(`budget_ranges.${form.values.budgetRange}`) || '-'}</Text>
                  </Group>
                </Stack>
              </Card>
            </div>
          </Stepper.Completed>
        </Stepper>
      </div>

      {/* Navigation Buttons */}
      <Group justify="space-between" mt="xl">
        <AnimatedButton
          variant="subtle"
          onClick={prevStep}
          disabled={active === 0}
          leftSection={<IconArrowLeft size={16} />}
        >
          {t('common.back')}
        </AnimatedButton>
        
        {active < 3 ? (
          <AnimatedButton
            onClick={nextStep}
            rightSection={<IconArrowRight size={16} />}
          >
            {t('dashboard.next', 'Next')}
          </AnimatedButton>
        ) : active === 3 ? (
          <AnimatedButton
            onClick={() => setActive(4)}
            rightSection={<IconCheck size={16} />}
            color="green"
          >
            {t('dashboard.review', 'Review')}
          </AnimatedButton>
        ) : (
          <AnimatedButton
            onClick={() => form.onSubmit(handleSubmit)()}
            loading={loading}
            leftSection={<IconBolt size={16} />}
            className="submit-button"
            color="blue"
            size="md"
          >
            {t('form.submit')}
          </AnimatedButton>
        )}
      </Group>
    </Paper>
  )
}