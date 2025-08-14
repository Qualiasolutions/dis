import { useRef, useState } from 'react'
import {
  Menu,
  Avatar,
  Group,
  Text,
  Badge,
  Divider,
  ActionIcon,
  Button,
} from '@mantine/core'
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconLogin,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../stores/authStore'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, signOut, isAuthenticated, getUserRole } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLButtonElement>(null)

  // Animations
  useGSAP(() => {
    if (isOpen && chevronRef.current) {
      gsap.to(chevronRef.current, {
        rotation: 180,
        duration: 0.3,
        ease: "power2.out"
      })
    } else if (!isOpen && chevronRef.current) {
      gsap.to(chevronRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }, { dependencies: [isOpen] })

  const handleSignOut = async () => {
    // Animate out before signing out
    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: async () => {
          try {
            await signOut()
            notifications.show({
              title: t('auth.sign_out'),
              message: t('messages.form_submitted'),
              color: 'blue',
            })
          } catch (error) {
            notifications.show({
              title: t('status.error'),
              message: t('messages.sync_error'),
              color: 'red',
            })
          }
        }
      })
    }
  }

  const handleAvatarHover = () => {
    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  const handleAvatarLeave = () => {
    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  if (!isAuthenticated()) {
    return (
      <Button
        component={Link}
        to="/auth"
        variant="subtle"
        leftSection={<IconLogin size={16} />}
        size="sm"
        className="transform transition-all hover:scale-105"
      >
        {t('auth.sign_in')}
      </Button>
    )
  }

  const userName = user?.consultant_profile?.name || user?.email?.split('@')[0] || 'User'
  const userRole = getUserRole()

  return (
    <Menu 
      shadow="md" 
      width={200}
      opened={isOpen}
      onChange={setIsOpen}
      transitionProps={{
        transition: 'pop-top-right',
        duration: 200
      }}
    >
      <Menu.Target>
        <Group 
          ref={menuRef}
          style={{ cursor: 'pointer' }}
          className="p-2 rounded-lg hover:bg-dealership-gray transition-colors"
          onMouseEnter={handleAvatarHover}
          onMouseLeave={handleAvatarLeave}
        >
          <div ref={avatarRef} className="transform-gpu">
            <Avatar 
              size="sm" 
              radius="xl" 
              className="bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold shadow-clean"
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <Text size="sm" fw={500} className="text-dealership-black">
              {userName}
            </Text>
            {userRole && (
              <Badge 
                size="xs" 
                variant="light" 
                className="bg-dealership-light text-dealership-dark-text"
              >
                {t(`roles.${userRole}`, userRole)}
              </Badge>
            )}
          </div>
          <ActionIcon 
            ref={chevronRef}
            variant="subtle" 
            size="sm"
            className="transform-gpu"
          >
            <IconChevronDown size={14} />
          </ActionIcon>
        </Group>
      </Menu.Target>

      <Menu.Dropdown className="animate-fade-in">
        <Menu.Item
          leftSection={<IconUser size={14} />}
          component={Link}
          to="/profile"
          className="hover:translate-x-1 transition-transform"
        >
          {t('auth.profile')}
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconSettings size={14} />}
          component={Link}
          to="/settings"
          className="hover:translate-x-1 transition-transform"
        >
          {t('auth.settings')}
        </Menu.Item>

        <Divider />

        <Menu.Item
          leftSection={<IconLogout size={14} />}
          color="red"
          onClick={handleSignOut}
          className="hover:translate-x-1 transition-transform"
        >
          {t('auth.sign_out')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}