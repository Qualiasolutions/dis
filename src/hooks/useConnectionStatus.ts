import { useState, useEffect } from 'react'
import { checkConnection, syncPendingVisits } from '../lib/supabase'

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const checkAndSync = async () => {
    const connectionStatus = await checkConnection()
    setIsOnline(connectionStatus)
    
    if (connectionStatus && !isSyncing) {
      setIsSyncing(true)
      try {
        await syncPendingVisits()
        setLastSyncTime(new Date())
      } catch (error) {
        console.error('Sync failed:', error)
      } finally {
        setIsSyncing(false)
      }
    }
    
    return connectionStatus
  }

  useEffect(() => {
    // Check connection on mount
    checkAndSync()

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      checkAndSync()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection every 30 seconds
    const interval = setInterval(checkAndSync, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isSyncing])

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    checkConnection: checkAndSync,
  }
}