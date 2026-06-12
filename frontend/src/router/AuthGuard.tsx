import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store'
import type { RoleCode } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: RoleCode[]
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRoles }) => {
  const location = useLocation()
  const { isLoggedIn, user } = useUserStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = user?.roles?.some(role => requiredRoles.includes(role))
    if (!hasRequiredRole) {
      if (user?.roles?.some(role => ['ADMIN', 'FINANCE_MANAGER', 'APPROVER'].includes(role))) {
        return <Navigate to="/admin/dashboard" replace />
      }
      return <Navigate to="/portal/apply" replace />
    }
  }

  return <>{children}</>
}

export default AuthGuard
