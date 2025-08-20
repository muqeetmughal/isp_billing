// src/component/RoleRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useFrappeAuth } from "frappe-react-sdk";

const RoleRoute = () => {
  const { currentUser } = useFrappeAuth();
  const adminEmail = "salmansaeed7272@gmail.com";

  if (!currentUser) {
    // If somehow not authenticated, force redirect to login
    return <Navigate to="/login" replace />;
  }

  // If admin tries to go to dashboard → send to admin_dashboard
  if (window.location.pathname.startsWith("/dashboard") && currentUser === adminEmail) {
    return <Navigate to="/admin_dashboard" replace />;
  }

  // If non-admin tries to go to admin_dashboard → send to dashboard
  if (window.location.pathname.startsWith("/admin_dashboard") && currentUser !== adminEmail) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
