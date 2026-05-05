// AuthRedirect.jsx (new file)
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function AuthRedirect({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-80">Loading…</p>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    return (
      <Navigate 
        to={user.role === 'recruiter' ? '/recruiter' : '/jobseeker'} 
        replace 
      />
    );
  }

  return children;
}