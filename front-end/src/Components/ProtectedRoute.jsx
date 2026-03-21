import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-80">Loading…</p>
      </div>
    );
  }

  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If role is required and user doesn't match, redirect to appropriate dashboard
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "recruiter") {
      return <Navigate to="/recruiter" replace />;
    }
    return <Navigate to="/jobseeker" replace />;
  }

  return children;
}
