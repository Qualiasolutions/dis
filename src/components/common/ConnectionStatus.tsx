import { Alert, Text, Group, ActionIcon, Loader } from '@mantine/core'
import { IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'

export function ConnectionStatus() {
  const { t } = useTranslation()
  const { isOnline, isSyncing, lastSyncTime, checkConnection } = useConnectionStatus()

  if (isOnline && !isSyncing) {
    return null // Don't show anything when everything is working
  }

  return (
    <Alert
      color={isOnline ? 'blue' : 'red'}
      icon={
        isSyncing ? (
          <Loader size="sm" />
        ) : isOnline ? (
          <IconWifi size={16} />
        ) : (
          <IconWifiOff size={16} />
        )
      }
      style={{
        position: 'fixed',
        top: 70, // Below header
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '90vw',
      }}
    >
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>
            {isSyncing
              ? t('status.syncing')
              : isOnline
              ? t('status.online')
              : t('status.offline')}
          </Text>
          {lastSyncTime && (
            <Text size="xs" c="dimmed">
              {t('messages.sync_complete')}: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
          {!isOnline && (
            <Text size="xs">
              {t('messages.form_saved_offline')}
            </Text>
          )}
        </div>
        
        {!isOnline && (
          <ActionIcon
            variant="subtle"
            onClick={checkConnection}
            disabled={isSyncing}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>
    </Alert>
  )
}