import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Select,
  Divider,
  Avatar,
  Paper,
  Timeline,
  Alert,
  LoadingOverlay,
} from '@mantine/core'
import {
  IconUser,
  IconPhone,
  IconMail,
  IconCar,
  IconClock,
  IconNote,
  IconDeviceFloppy,
  IconX,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { QueueVisit } from '../../stores/queueStore'

interface CustomerProfileModalProps {
  visitId: string
  opened: boolean
  onClose: () => void
  onStatusUpdate: (visitId: string, status: string) => Promise<void>
}

export function CustomerProfileModal({
  visitId,
  opened,
  onClose,
  onStatusUpdate
}: CustomerProfileModalProps) {
  const [visit, setVisit] = useState<QueueVisit | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()

  const form = useForm({
    initialValues: {
      notes: '',
      status: 'assigned' as any,
      consultantNotes: '',
    }
  })

  useEffect(() => {
    if (opened && visitId) {
      fetchVisitDetails()
    }
  }, [opened, visitId])

  const fetchVisitDetails = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customer:customers(*),
          consultant:consultants(id, name)
        `)
        .eq('id', visitId)
        .single()

      if (error) throw error
      
      setVisit(data)
      form.setValues({
        notes: data.notes || '',
        status: data.status,
        consultantNotes: data.consultant_notes || '',
      })
    } catch (error) {
      console.error('Failed to fetch visit details:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load customer details',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!visit) return
    
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          consultant_notes: form.values.consultantNotes,
          notes: form.values.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)

      if (error) throw error

      notifications.show({
        title: 'Saved',
        message: 'Notes updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save notes',
        color: 'red',
        icon: <IconX size={16} />,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!visit) return
    
    try {
      await onStatusUpdate(visitId, newStatus)
      setVisit(prev => prev ? { ...prev, status: newStatus as any } : null)
      form.setFieldValue('status', newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'blue',
      contacted: 'yellow',
      assigned: 'green',
      in_progress: 'orange',
      completed: 'gray',
      lost: 'red',
    }
    return colors[status as keyof typeof colors] || 'gray'
  }

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'lost', label: 'Lost' },
  ]

  if (!visit) {
    return (
      <Modal opened={opened} onClose={onClose} title="Customer Details" size="lg">
        <LoadingOverlay visible={loading} />
      </Modal>
    )
  }

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Customer Profile" 
      size="lg"
      styles={{
        header: { paddingBottom: '1rem' },
        body: { paddingTop: 0 }
      }}
    >
      <LoadingOverlay visible={loading} />
      
      <Stack gap="lg">
        {/* Customer Header */}
        <Paper p="md" withBorder>
          <Group>
            <Avatar size="lg" color="blue" radius="xl">
              <IconUser size={32} />
            </Avatar>
            <div style={{ flex: 1 }}>
              <Group align="center" gap="sm">
                <Text size="lg" fw={600}>
                  {visit.customer.name}
                </Text>
                <Badge color={getStatusColor(visit.status)} variant="light">
                  {visit.status.toUpperCase()}
                </Badge>
              </Group>
              
              <Stack gap="xs" mt="sm">
                <Group gap="xs">
                  <IconPhone size={16} />
                  <Text size="sm" dir="ltr">{visit.customer.phone}</Text>
                </Group>
                
                {visit.customer.email && (
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">{visit.customer.email}</Text>
                  </Group>
                )}
                
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text size="sm" c="dimmed">
                    Arrived: {formatTime(visit.created_at)}
                  </Text>
                </Group>
              </Stack>
            </div>
          </Group>
        </Paper>

        {/* Vehicle Interest */}
        {visit.vehicle_interest && (
          <Paper p="md" withBorder>
            <Group gap="xs" mb="sm">
              <IconCar size={18} />
              <Text fw={500}>Vehicle Interest</Text>
            </Group>
            
            {typeof visit.vehicle_interest === 'object' ? (
              <Stack gap="xs">
                <Group>
                  <Text size="sm" c="dimmed">Type:</Text>
                  <Text size="sm">{visit.vehicle_interest.type}</Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">Budget:</Text>
                  <Text size="sm">{visit.vehicle_interest.budget_range}</Text>
                </Group>
                {visit.vehicle_interest.purchase_timeline && (
                  <Group>
                    <Text size="sm" c="dimmed">Timeline:</Text>
                    <Text size="sm">{visit.vehicle_interest.purchase_timeline}</Text>
                  </Group>
                )}
              </Stack>
            ) : (
              <Text size="sm">{visit.vehicle_interest}</Text>
            )}
          </Paper>
        )}

        {/* Status Management */}
        <Paper p="md" withBorder>
          <Text fw={500} mb="md">Status Management</Text>
          
          <Group>
            <Select
              data={statusOptions}
              value={form.values.status}
              onChange={(value) => value && handleStatusChange(value)}
              w={200}
            />
            
            {visit.status === 'assigned' && (
              <Button
                onClick={() => handleStatusChange('in_progress')}
                leftSection={<IconCheck size={16} />}
                color="blue"
              >
                Start Service
              </Button>
            )}
            
            {visit.status === 'in_progress' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                leftSection={<IconCheck size={16} />}
                color="green"
              >
                Complete
              </Button>
            )}
          </Group>
        </Paper>

        {/* Notes Section */}
        <Paper p="md" withBorder>
          <Group gap="xs" mb="md">
            <IconNote size={18} />
            <Text fw={500}>Notes & Follow-up</Text>
          </Group>
          
          <Stack gap="md">
            {visit.notes && (
              <div>
                <Text size="sm" c="dimmed" mb="xs">Reception Notes:</Text>
                <Text size="sm" p="sm" bg="gray.0" style={{ borderRadius: '4px' }}>
                  {visit.notes}
                </Text>
              </div>
            )}
            
            <TextInput
              label="Consultant Notes"
              placeholder="Add your consultation notes, observations, and next steps..."
              multiline
              minRows={4}
              {...form.getInputProps('consultantNotes')}
            />
            
            <Group>
              <Button
                onClick={handleSaveNotes}
                loading={saving}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Save Notes
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}