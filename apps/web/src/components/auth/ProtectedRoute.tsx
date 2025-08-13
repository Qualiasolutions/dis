import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader, Center, Alert } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { useAuthStore, type UserRole } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  fallbackPath?: string
  showUnauthorized?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth',
  showUnauthorized = true 
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, hasPermission, loading, initialized } = useAuthStore()

  // Show loading while initializing auth
  if (!initialized || loading) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Check role permissions if required
  if (requiredRole && !hasPermission(requiredRole)) {
    if (!showUnauthorized) {
      return <Navigate to="/" replace />
    }

    return (
      <Center h="50vh">
        <Alert
          icon={<IconLock size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
          maw={400}
          ta="center"
        >
          You don't have permission to access this page.
          {Array.isArray(requiredRole) 
            ? ` Required roles: ${requiredRole.join(', ')}`
            : ` Required role: ${requiredRole}`
          }
        </Alert>
      </Center>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole?: UserRole | UserRole[]
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}