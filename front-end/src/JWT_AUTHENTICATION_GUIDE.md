# JWT Authentication & Protected Routing Implementation

## Overview
Your application now has JWT-based authentication with persistent user sessions and protected routes. Users' credentials and tokens are securely stored in localStorage and automatically restored on page refresh.

## Changes Made

### 1. **AuthContext** (`src/Context/AuthContext.jsx`)
- Centralized authentication state management
- Stores JWT token and user details
- Automatically persists auth state to localStorage
- Provides `login()` and `register()` functions
- Provides `logout()` function for clearing auth state
- Exports `useAuth()` hook for easy access in any component

**Key Features**:
```javascript
const { user, token, isAuthenticated, login, register, logout, loading } = useAuth();
```

### 2. **ProtectedRoute Component** (`src/Components/ProtectedRoute.jsx`)
- Wraps protected pages to check authentication
- Redirects unauthenticated users to `/signin`
- Supports role-based access control (jobseeker vs recruiter)
- Shows loading state while checking auth status

**Usage**:
```javascript
<Route
  path="/jobseeker"
  element={
    <ProtectedRoute requiredRole="jobseeker">
      <JobSeekerLanding />
    </ProtectedRoute>
  }
/>
```

### 3. **Updated App.jsx**
- Wrapped entire app with `AuthProvider`
- All JobSeeker and Recruiter routes are now protected
- Public routes: `/`, `/signin`, `/signup`, `/interview`, `/tester`, etc.
- Protected routes redirect to signin if not authenticated

### 4. **Auth Pages Updated**
- **Signin.jsx**: Uses `useAuth()` hook, calls `login()` from context
- **Signup.jsx**: Uses `useAuth()` hook, calls `register()` from context

### 5. **Recruiter Pages Updated**
- **RecruiterCompanyPage.jsx**: Simplified to use user from AuthContext instead of database calls
- Uses localStorage to store company profile (can be extended to backend)

## Authentication Flow

### Sign Up → Login → Dashboard

1. **User Signs Up** (`/signup`)
   - Enters name, role, email, password
   - `register()` is called via AuthContext
   - Token and user details are stored in localStorage
   - Redirected to role-specific onboarding:
     - Recruiter → `/recruiter/company` (company setup)
     - Job Seeker → `/jobseeker/preferences` (preferences setup)

2. **User Signs In** (`/signin`)
   - Enters email and password
   - `login()` is called via AuthContext
   - Token and user stored in localStorage
   - Redirected to role-specific dashboard:
     - Recruiter → `/recruiter`
     - Job Seeker → `/jobseeker`

3. **Page Refresh**
   - AuthContext automatically checks localStorage
   - Restores token and user state
   - User stays logged in (no need to sign in again)

4. **Logout**
   - `logout()` clears token and user from state
   - localStorage is cleared
   - User redirected to appropriate page

## Protected Routes Structure

```
Public Routes:
├── / (Analyzer Page)
├── /signin (Sign in page)
├── /signup (Sign up page)
└── Other pages...

Protected Recruiter Routes:
├── /recruiter (Dashboard) - requires role="recruiter"
└── /recruiter/company (Setup) - requires role="recruiter"

Protected Job Seeker Routes:
├── /jobseeker (Landing) - requires role="jobseeker"
└── /jobseeker/preferences (Preferences) - requires role="jobseeker"
```

## How to Use useAuth() in Components

```javascript
import { useAuth } from "../Context/AuthContext";

export default function MyComponent() {
  const { user, token, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome {user.fullName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Token Storage

Tokens are stored in localStorage with keys:
- `token`: JWT token string
- `user`: JSON stringified user object

**User object structure**:
```javascript
{
  id: "user_id",
  email: "user@example.com",
  fullName: "User Name",
  role: "recruiter" | "jobseeker"
}
```

## Security Notes

⚠️ **For Production**:
1. Consider using `httpOnly` cookies instead of localStorage (requires backend support)
2. Implement token refresh mechanism for expired tokens
3. Add CORS protection on backend
4. Validate tokens on every API call
5. Use HTTPS only
6. Implement rate limiting on auth endpoints

## Next Steps

1. Connect the backend login/register endpoints to the auth service
2. Ensure backend returns JWT token with user data
3. Add token refresh logic if tokens expire
4. Update other pages (JobSeeker and Recruiter pages) to use `useAuth()` for user info
5. Implement logout functionality in navigation headers
