import { useEffect, useState } from 'react'
import { Notification, Button } from '@mantine/core'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

export function PWAUpdater() {
  const { t } = useTranslation()
  const [showUpdateNotification, setShowUpdateNotification] = useState(false)
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('SW Registered')
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
    onNeedRefresh() {
      setShowUpdateNotification(true)
    },
    onOfflineReady() {
      console.log('SW offline ready')
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShowUpdateNotification(false)
    setNeedRefresh(false)
  }

  const handleDismiss = () => {
    setShowUpdateNotification(false)
    setNeedRefresh(false)
  }

  if (!showUpdateNotification) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      zIndex: 1000,
      maxWidth: '400px'
    }}>
      <Notification
        title={t('pwa.update_available')}
        withCloseButton={false}
        color="blue"
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Button size="xs" onClick={handleUpdate}>
            {t('pwa.update_now')}
          </Button>
          <Button size="xs" variant="subtle" onClick={handleDismiss}>
            {t('pwa.update_later')}
          </Button>
        </div>
      </Notification>
    </div>
  )
}