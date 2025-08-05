import { Navigate, Outlet } from 'react-router-dom'
import { useFrappeAuth } from 'frappe-react-sdk'

const PrivateRoute = () => {
  const { currentUser, isLoading } = useFrappeAuth()

  if (isLoading) return <div>Loading...</div>

  return currentUser ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
