import React, { useState, useRef, useEffect } from 'react'
import {
  Card,
  Text,
  TextInput,
  Stack,
  Group,
  Badge,
  Box,
  ScrollArea,
  ActionIcon,
  Avatar,
  ThemeIcon,
  Button,
  Tooltip,
  Collapse
} from '@mantine/core'
import {
  IconBrain,
  IconSend,
  IconUser,
  IconRobot,
  IconRefresh,
  IconCar,
  IconCurrencyDollar,
  IconCalendar,
  IconPhone,
  IconBulb
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: Array<{
    label: string
    action: string
    icon?: React.ReactNode
  }>
  isTyping?: boolean
}

interface AIChatbotProps {
  customerId?: string
  customerName?: string
  context?: 'general' | 'sales' | 'support' | 'financing'
  onActionClick?: (action: string) => void
}

export function AIChatbot({ 
  customerId,
  customerName,
  context = 'general',
  onActionClick
}: AIChatbotProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: customerName 
        ? t('ai.chatbot.welcomePersonal', { name: customerName })
        : t('ai.chatbot.welcome'),
      timestamp: new Date(),
      suggestions: getInitialSuggestions(context)
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ 
        top: scrollAreaRef.current.scrollHeight, 
        behavior: 'smooth' 
      })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI processing
    setTimeout(() => {
      const botResponse = generateBotResponse(input, context, customerName)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }

  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(action)
    }
    
    // Add action confirmation to chat
    const actionMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: t('ai.chatbot.actionConfirm', { action }),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, actionMessage])
  }

  const quickActions = [
    { label: t('ai.chatbot.scheduleTestDrive'), icon: <IconCar size={16} />, action: 'schedule_test_drive' },
    { label: t('ai.chatbot.viewInventory'), icon: <IconCar size={16} />, action: 'view_inventory' },
    { label: t('ai.chatbot.getFinancing'), icon: <IconCurrencyDollar size={16} />, action: 'financing_options' },
    { label: t('ai.chatbot.contactConsultant'), icon: <IconPhone size={16} />, action: 'contact_consultant' }
  ]

  return (
    <Card withBorder h={600} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group justify="space-between" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="blue">
            <IconBrain size={16} />
          </ThemeIcon>
          <Box>
            <Text fw={500}>{t('ai.chatbot.title')}</Text>
            <Group gap="xs">
              <Badge size="xs" variant="dot" color="green">
                {t('common.online')}
              </Badge>
              <Text size="xs" c="dimmed">
                {t('ai.chatbot.poweredBy')} GPT-4
              </Text>
            </Group>
          </Box>
        </Group>
        
        <Group gap="xs">
          <Tooltip label={t('ai.chatbot.clearChat')}>
            <ActionIcon size="sm" variant="light" onClick={() => setMessages([messages[0]!])}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Quick Actions */}
      <Collapse in={showSuggestions}>
        <Box py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <ScrollArea.Autosize mah={60}>
            <Group gap="xs">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  size="xs"
                  variant="light"
                  leftSection={action.icon}
                  onClick={() => handleActionClick(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </Group>
          </ScrollArea.Autosize>
        </Box>
      </Collapse>

      {/* Messages */}
      <ScrollArea 
        style={{ flex: 1 }} 
        p="md" 
        ref={scrollAreaRef}
        type="scroll"
      >
        <Stack gap="md">
          {messages.map((message) => (
            <Box key={message.id}>
              <Group 
                gap="sm" 
                align="flex-start"
                style={{ 
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row' 
                }}
              >
                {message.type === 'bot' ? (
                  <Avatar color="blue" radius="xl" size="sm">
                    <IconRobot size={18} />
                  </Avatar>
                ) : (
                  <Avatar color="gray" radius="xl" size="sm">
                    <IconUser size={18} />
                  </Avatar>
                )}
                
                <Box 
                  maw="70%"
                  style={{
                    background: message.type === 'user' 
                      ? 'var(--mantine-color-blue-1)' 
                      : 'var(--mantine-color-gray-1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    borderBottomLeftRadius: message.type === 'bot' ? '2px' : '8px',
                    borderBottomRightRadius: message.type === 'user' ? '2px' : '8px'
                  }}
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Text>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <Stack gap="xs" mt="sm">
                      <Text size="xs" c="dimmed">{t('ai.chatbot.suggestions')}:</Text>
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          size="xs"
                          variant="default"
                          fullWidth
                          styles={{ label: { textAlign: 'left' } }}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </Stack>
                  )}
                  
                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <Group gap="xs" mt="sm">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="xs"
                          variant="light"
                          leftSection={action.icon}
                          onClick={() => handleActionClick(action.action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Group>
                  )}
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true, locale })}
                  </Text>
                </Box>
              </Group>
            </Box>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <Group gap="sm" align="flex-start">
              <Avatar color="blue" radius="xl" size="sm">
                <IconRobot size={18} />
              </Avatar>
              <Box 
                style={{
                  background: 'var(--mantine-color-gray-1)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  borderBottomLeftRadius: '2px'
                }}
              >
                <Group gap="xs">
                  <Box className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </Box>
                </Group>
              </Box>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      {/* Input Area */}
      <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <TextInput
            style={{ flex: 1 }}
            placeholder={t('ai.chatbot.typeMessage')}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            rightSection={
              <Group gap={4}>
                <Tooltip label={t('ai.chatbot.attachFile')}>
                  <ActionIcon size="sm" variant="subtle">
                    <IconPaperclip size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('ai.chatbot.voiceInput')}>
                  <ActionIcon size="sm" variant="subtle">
                    <IconMicrophone size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
          />
          <ActionIcon 
            size="lg" 
            color="blue" 
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Box>

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background-color: #999;
          border-radius: 50%;
          display: inline-block;
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Card>
  )
}

// Helper functions
function getInitialSuggestions(context: string): string[] {
  const suggestions: Record<string, string[]> = {
    general: [
      'What vehicles do you have available?',
      'Can I schedule a test drive?',
      'What financing options are available?',
      'Tell me about your best deals'
    ],
    sales: [
      'Show me SUVs under 30,000 JOD',
      'Compare Toyota Camry vs Honda Accord',
      'What colors are available?',
      'Do you have any electric vehicles?'
    ],
    support: [
      'How do I schedule a service appointment?',
      'What is covered under warranty?',
      'Can you check my vehicle status?',
      'I need to speak with my consultant'
    ],
    financing: [
      'What are the current interest rates?',
      'Can I get pre-approved for financing?',
      'What documents do I need?',
      'Calculate monthly payment for 25,000 JOD'
    ]
  }
  
  return suggestions[context] || suggestions.general || []
}

function generateBotResponse(input: string, context: string, customerName?: string): Message {
  const lowercaseInput = input.toLowerCase()
  
  // Vehicle inquiry
  if (lowercaseInput.includes('vehicle') || lowercaseInput.includes('car') || lowercaseInput.includes('suv')) {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `We have a great selection of vehicles! Our current inventory includes:
      
• Toyota Camry (2024) - Starting from 22,000 JOD
• Honda CR-V (2024) - Starting from 28,000 JOD  
• Nissan Altima (2024) - Starting from 19,000 JOD
• Mazda CX-5 (2024) - Starting from 26,000 JOD

Would you like to see more details about any specific model?`,
      timestamp: new Date(),
      suggestions: [
        'Tell me more about Toyota Camry',
        'Show me SUVs only',
        'What about electric vehicles?'
      ],
      actions: [
        { label: 'View Full Inventory', action: 'view_inventory', icon: <IconCar size={14} /> }
      ]
    }
  }
  
  // Test drive
  if (lowercaseInput.includes('test drive') || lowercaseInput.includes('test')) {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `${customerName ? `Of course, ${customerName}!` : 'Certainly!'} I can help you schedule a test drive. 
      
Our test drive hours are:
• Saturday-Thursday: 9:00 AM - 7:00 PM
• Friday: 2:00 PM - 7:00 PM

Which vehicle would you like to test drive?`,
      timestamp: new Date(),
      actions: [
        { label: 'Schedule Now', action: 'schedule_test_drive', icon: <IconCalendar size={14} /> },
        { label: 'Call Showroom', action: 'call_showroom', icon: <IconPhone size={14} /> }
      ]
    }
  }
  
  // Financing
  if (lowercaseInput.includes('financ') || lowercaseInput.includes('loan') || lowercaseInput.includes('payment')) {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `We offer flexible financing options through multiple banks:

• Interest rates starting from 4.5% APR
• Up to 7 years financing term
• Down payment as low as 10%
• Quick approval (usually within 24 hours)

We work with Arab Bank, Housing Bank, and Bank al Etihad.

Would you like to calculate your monthly payment or get pre-approved?`,
      timestamp: new Date(),
      suggestions: [
        'Calculate monthly payment',
        'Get pre-approved',
        'What documents do I need?'
      ],
      actions: [
        { label: 'Financing Calculator', action: 'financing_calculator', icon: <IconCurrencyDollar size={14} /> }
      ]
    }
  }
  
  // Price/deal inquiry
  if (lowercaseInput.includes('price') || lowercaseInput.includes('deal') || lowercaseInput.includes('offer')) {
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: `Great timing! We have special offers this month:

🎯 **Current Promotions:**
• 0% interest for 12 months on selected models
• Free insurance for the first year
• Extended warranty (5 years/100,000 km)
• Trade-in bonus: Extra 2,000 JOD on your trade-in value

💰 **Hot Deals:**
• Nissan Sentra 2023 - Was 18,500 JOD, Now 16,900 JOD
• Toyota Corolla 2023 - Special price: 20,500 JOD with free accessories

Would you like more details about any of these offers?`,
      timestamp: new Date(),
      actions: [
        { label: 'View All Deals', action: 'view_deals', icon: <IconBulb size={14} /> }
      ]
    }
  }
  
  // Default response
  return {
    id: Date.now().toString(),
    type: 'bot',
    content: `I understand you're asking about "${input}". Let me help you with that.

Based on your question, I can assist you with:
• Vehicle information and availability
• Scheduling test drives
• Financing options and calculations
• Current promotions and deals
• Service appointments

How can I help you specifically?`,
    timestamp: new Date(),
    suggestions: getInitialSuggestions(context)
  }
}