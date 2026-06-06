import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store'
import type { UserRole } from '@/types'

interface RouteGuardProps {
  children: React.ReactNode
  roles?: UserRole[]
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children, roles }) => {
  const { token, hasRole } = useUserStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}

export default RouteGuard
