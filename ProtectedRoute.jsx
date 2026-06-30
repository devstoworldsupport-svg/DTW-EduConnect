// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && !roles.includes(profile?.role)) {
    return <Navigate to="/app" replace />
  }

  return children
}
