# Continental AI - Frontend

React + Vite frontend for the Continental AI recruitment platform.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:
```
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Development Server

```bash
npm run dev
```

Runs on `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── Pages/
│   ├── Auth/
│   │   ├── Signin.jsx          # Login page
│   │   └── Signup.jsx          # Registration page
│   ├── Recruiter/
│   │   ├── RecruiterLanding.jsx       # Dashboard
│   │   └── RecruiterCompanyPage.jsx   # Company settings
│   ├── Jobseaker/
│   │   ├── JobSeekerLanding.jsx       # Dashboard
│   │   └── JobSeekerPreferences.jsx   # Preferences
│   ├── HomePage.jsx            # Landing page
│   ├── InterviewScreen.jsx     # Interview page
│   ├── InterviewScheduler.jsx  # Schedule interview
│   ├── ProjectScreen.jsx       # Project page
│   ├── ProjectSubmission.jsx   # Submit project
│   ├── InterviewTester.jsx     # Interview testing
│   └── proctoredreport.jsx     # Interview report
├── Components/
│   ├── ProtectedRoute.jsx      # Route protection
│   ├── AuthRedirect.jsx        # Auth redirect wrapper
│   ├── AnalyzerPage.jsx        # Analysis page
│   ├── CandidateCard.jsx       # Candidate card
│   ├── CandidatesList.jsx      # Candidate list
│   ├── CandidateReport.jsx     # Report component
│   ├── JobCard.jsx             # Job posting card
│   ├── JobListPanel.jsx        # Job list
│   ├── JobDetailPanel.jsx      # Job details
│   ├── JobSearchBar.jsx        # Search bar
│   ├── JobHeader.jsx           # Header
│   ├── ApplyModal.jsx          # Application modal
│   ├── CreateJobModal.jsx      # Job creation modal
│   ├── ResumeBuilderModal.jsx  # Resume builder
│   ├── InterviewReview.jsx     # Interview review
│   ├── RecruiterNavbar.jsx     # Navbar
│   ├── VedioScreen.jsx         # Video component
│   └── inputform.jsx           # Input form
├── Context/
│   └── AuthContext.jsx         # Auth state management
├── Services/
│   └── database.js             # API calls
├── lib/
│   └── supabaseClient.js       # Supabase client
├── assets/                     # Images, icons
├── App.jsx                     # Main app
├── App.css                     # Global styles
├── main.jsx                    # Entry point
└── index.css                   # Base styles
```

## 🔐 Authentication

### AuthContext.jsx
Manages:
- User state (profile, role)
- Token (JWT)
- Loading state
- Login/Register/Logout functions

```javascript
const { user, token, loading, isAuthenticated, login, register, logout } = useAuth();
```

### ProtectedRoute.jsx
Protects routes by role:
```javascript
<Route path="/recruiter" element={
  <ProtectedRoute requiredRole="recruiter">
    <RecruiterLanding />
  </ProtectedRoute>
} />
```

### AuthRedirect.jsx
Prevents authenticated users from accessing auth pages:
```javascript
<Route path="/signin" element={
  <AuthRedirect>
    <Signin />
  </AuthRedirect>
} />
```

### Flow
1. User signs up/in
2. Token stored in localStorage
3. On app load, token restored from localStorage
4. ProtectedRoute checks authentication
5. AuthRedirect prevents accessing signin/signup when logged in
6. Already-signed-in users redirected to dashboard

## 🎨 Pages

### Authentication Pages

**Signin.jsx**
- Email & password input
- Login with error handling
- Redirect to signup
- Redirects to recruiter/jobseeker on success

**Signup.jsx**
- Registration form
- Role selection (recruiter/jobseeker)
- Email validation
- Password requirements

### Recruiter Pages

**RecruiterLanding.jsx**
- Job listings
- Create job modal
- Candidate management
- Dashboard overview

**RecruiterCompanyPage.jsx**
- Company profile
- Settings
- Team management

### Job Seeker Pages

**JobSeekerLanding.jsx**
- Browse job listings
- Apply to jobs
- View applications
- Track status

**JobSeekerPreferences.jsx**
- Set job preferences
- Preferred locations
- Desired roles
- Experience level

### Interview Pages

**InterviewScreen.jsx**
- Join interview
- Video/audio setup
- Interview UI

**InterviewScheduler.jsx**
- Schedule interview
- Date/time selection
- Calendar integration

**InterviewTester.jsx**
- Test setup
- Equipment check

**proctoredreport.jsx**
- Interview report
- Performance metrics
- Flagged behaviors

### Project Pages

**ProjectScreen.jsx**
- View project assignment
- Project details

**ProjectSubmission.jsx**
- Submit project
- Repository link
- Project description

## 🛠️ Components

### ProtectedRoute
Wraps routes requiring authentication:
```javascript
<ProtectedRoute requiredRole="recruiter">
  <Dashboard />
</ProtectedRoute>
```

### AuthRedirect
Prevents access to auth pages when signed in:
```javascript
<AuthRedirect>
  <Signin />
</AuthRedirect>
```

### CandidateCard
Displays candidate information:
- Profile photo
- Name, email
- Match score
- Action buttons

### JobCard
Displays job listing:
- Job title, company
- Location, salary
- Apply button

### Modals
- ApplyModal - Apply to job
- CreateJobModal - Post new job
- ResumeBuilderModal - Build resume

## 🔌 API Integration

### Services/database.js
```javascript
// Authentication
login(email, password) - Sign in
register(email, password, role, fullName) - Sign up

// Jobs
getJobs() - List all jobs
getJob(id) - Get job details
createJob(data) - Create job
applyJob(jobId, resume) - Apply to job

// Applications
getApplications() - List applications
submitProject(appId, data) - Submit project
scheduleInterview(appId, dateTime) - Schedule interview

// Candidates
getCandidates(jobId) - Get job candidates
getCandidateDetails(candidateId) - Candidate details
```

## 📦 Tech Stack

- **React 18+** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios/Fetch** - HTTP client
- **Supabase JS** - Database client
- **Lucide React** - Icons
- **Context API** - State management

## 🎨 Styling

### Tailwind CSS
Global styles in `index.css`, `App.css`

Component-specific styles using Tailwind classes:
```javascript
<button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
  Click me
</button>
```

### Color Scheme
- **Primary**: Emerald/Teal
- **Secondary**: Gray
- **Accent**: Green

## 🔄 State Management

### Context API
User authentication managed globally:
```javascript
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // ...
}
```

Usage in components:
```javascript
const { user, isAuthenticated, login } = useAuth();
```

## 🌐 Supabase Integration

### supabaseClient.js
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Used for:
- Real-time database access
- File uploads (resumes, projects)
- User management

## 📱 Responsive Design

All pages are mobile-responsive using Tailwind's breakpoints:
```javascript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive layout */}
</div>
```

## 🔄 Workflows

### Job Seeker Workflow
1. Sign up as Job Seeker
2. Browse jobs
3. Apply with resume
4. Receive shortlist email
5. Schedule interview
6. Complete proctored interview
7. Submit project (if required)
8. Receive offer/rejection

### Recruiter Workflow
1. Sign up as Recruiter
2. Create job posting
3. View applications
4. Review resumes (AI analysis)
5. Shortlist candidates
6. Schedule interviews
7. Review interview reports
8. Send offer/rejection

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Not Found | Check API URL in .env |
| Auth not working | Clear localStorage, check token |
| Styles not loading | Run `npm run build` |
| Video not working | Check camera permissions |
| Can't upload resume | Check file size, format |

## 📚 ESLint Configuration

Config in `eslint.config.js`:
- React best practices
- React Router rules
- Hooks rules
- Accessibility checks

Run linting:
```bash
npm run lint
```

## 🚀 Build & Deploy

### Build
```bash
npm run build
```

Creates `dist/` folder with production build.

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Environment Variables for Production
Set in hosting platform:
```
VITE_BACKEND_URL=https://api.example.com
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## 📝 Performance Tips

1. Use React DevTools to check re-renders
2. Lazy load pages with React.lazy()
3. Optimize images
4. Use production build for testing

## 📞 Development

**Hot Module Replacement (HMR)**: Changes auto-refresh
**Fast Refresh**: Component state preserved during edits

## 📜 Available NPM Scripts

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint checker
npm run lint --fix   # Fix ESLint issues automatically
```

## 🔍 Development Tips

### Debugging

**Browser DevTools**
- Open DevTools: `F12` or `Ctrl+Shift+I`
- React tab: Inspect component hierarchy
- Console tab: Check for errors/warnings
- Network tab: Monitor API calls

**React DevTools Extension**
- Installed from Chrome/Firefox store
- Inspect component props/state
- Track re-renders
- Profile performance

**Vite HMR Debugging**
- Hot updates happen automatically
- State preserved during updates
- Check terminal for compilation errors

### Common Development Tasks

**Add new page**
1. Create file in `src/Pages/YourPage.jsx`
2. Add route in `App.jsx`
3. Use `ProtectedRoute` if authenticated
4. Import components as needed

**Add new component**
1. Create file in `src/Components/YourComponent.jsx`
2. Import in page/parent component
3. Export as default

**Add API service**
1. Add function in `src/Services/database.js`
2. Use in component with `.then()` or `async/await`
3. Handle errors with try/catch

**Styling new elements**
- Use Tailwind classes directly
- Follow existing color scheme (emerald/teal)
- Use responsive breakpoints: `md:`, `lg:`, `xl:`

## 📤 File Upload Handling

### Resume Upload
```javascript
const handleResumeUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_id', jobId);
  formData.append('candidate_id', candidateId);
  
  const response = await fetch(
    `${VITE_BACKEND_URL}/applications/analyze-and-save-application`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
};
```

**Supported formats**: `.pdf`, `.doc`, `.docx`
**Max size**: 10MB (adjust in backend as needed)

### Project Submission
```javascript
const submitProject = async (projectData) => {
  const response = await fetch(
    `${VITE_BACKEND_URL}/applications/submit-project`,
    {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );
};
```

## 🎯 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BACKEND_URL` | Backend API endpoint | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | `eyJ...` |

**Note**: Variables must start with `VITE_` to be accessible in code

## 🔗 API Error Handling

```javascript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // 4xx or 5xx error
    const error = await response.json();
    console.error('API Error:', error);
    throw new Error(error.detail || 'Request failed');
  }
  
  return await response.json();
} catch (err) {
  console.error('Error:', err);
  // Show user-friendly error message
}
```

## 🧪 Testing Components

**Manual Testing**
1. Run `npm run dev`
2. Navigate to component
3. Test all user interactions
4. Check browser console for errors
5. Use React DevTools to inspect state

**Testing Authentication Flow**
1. Sign up with test email
2. Check localStorage for token
3. Verify redirect to dashboard
4. Test logout
5. Verify redirect to signin

## 💾 Git Workflow

```bash
# Clone repo
git clone <repo-url>
cd front-end

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature

# Create Pull Request on GitHub
```

## 🚨 Common Issues & Solutions

### Issue: Port 5173 already in use
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

### Issue: Module not found
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### Issue: Styles not applying
```bash
# Rebuild Tailwind
npm run build

# Or restart dev server
# Sometimes CSS changes need restart
```

### Issue: API calls returning 401
```bash
# Check token in localStorage
localStorage.getItem('token')

# Check if token is valid
# Re-login to get fresh token
```

### Issue: Cannot read property of undefined
```javascript
// Use optional chaining
const email = user?.email || 'Unknown';

// Use nullish coalescing
const name = user?.name ?? 'Guest';
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Validate user input** - Check file types, sizes
3. **Use HTTPS in production** - Always use https
4. **Secure token storage** - localStorage is client-side (not ideal for sensitive data)
5. **CORS handling** - Backend should set proper CORS headers
6. **Sanitize API responses** - Validate data from backend

## 📊 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📞 Support & Contact

For issues:
1. Check .env configuration
2. Review browser console for errors
3. Check backend logs
4. Verify network requests in DevTools Network tab
5. Clear browser cache/localStorage
6. Restart dev server

---

**Project**: Continental AI - Intelligent Recruitment Platform
**Last Updated**: May 2026
**Version**: 1.0
