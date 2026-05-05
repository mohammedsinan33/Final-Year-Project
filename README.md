# AI Recruiter Pro - Final Year Project

## 📋 Overview

AI Recruiter Pro is an intelligent recruitment platform that combines AI-powered resume analysis, automated interview scheduling, proctored testing, and project-based candidate evaluation. The system is designed to streamline the hiring process for recruiters and provide candidates with a seamless application experience.

## 🎯 Key Features

### For Recruiters
- **Job Posting & Management**: Create and manage job openings
- **Resume Analysis**: AI-powered resume screening and matching with job requirements
- **Candidate Shortlisting**: Automated candidate ranking based on match scores
- **Interview Scheduling**: Built-in interview scheduler
- **Proctored Testing**: Monitor candidates during interviews with face detection, eye tracking, and spoofing detection
- **Project Assignment**: Assign real-world projects to qualified candidates
- **Email Notifications**: Automated shortlist and offer emails
- **Candidate Management**: View detailed candidate profiles and performance

### For Job Seekers
- **Resume Upload & Analysis**: Upload resumes for instant AI analysis
- **Job Browsing**: Search and apply to job openings
- **Interview Participation**: Join scheduled interviews with proctoring
- **Project Submission**: Submit project work for evaluation
- **Interview Reports**: View detailed feedback on interview performance
- **Job Preferences**: Set preferences for desired roles and companies

## 🏗️ Project Architecture

```
Final Project/
├── Backend/                           # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # Entry point
│   │   ├── llm_client.py             # AI/LLM integration
│   │   ├── schemas.py                # Data schemas
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── applications.py       # Resume & application management
│   │   │   ├── interview.py          # Interview scheduling
│   │   │   ├── recruiter.py          # Recruiter dashboard
│   │   │   ├── proctor.py            # Proctoring system
│   │   │   ├── analyze.py            # Resume analysis
│   │   │   └── finalreport.py        # Report generation
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── database.py           # DB helpers
│   │       ├── mails.py              # Email service
│   │       ├── resume.py             # Resume extraction
│   │       ├── repo.py               # Repository pattern
│   │       └── scheduler.py          # Task scheduling
│   ├── Proctoring-AI-master/         # Proctoring module
│   │   ├── face_detector.py
│   │   ├── eye_tracker.py
│   │   ├── face_spoofing.py
│   │   ├── head_pose_estimation.py
│   │   ├── mouth_opening_detector.py
│   │   ├── person_and_phone.py
│   │   ├── audio_part.py
│   │   ├── main.py
│   │   ├── face_detection/           # Face detection models
│   │   ├── eye_tracking/             # Eye tracking models
│   │   ├── models/                   # Pre-trained models
│   │   └── coco models/              # COCO models
│   ├── requirements.txt
│   └── README.md
│
└── front-end/                         # React/Vite Frontend
    ├── src/
    │   ├── Pages/
    │   │   ├── Auth/                 # Authentication pages
    │   │   │   ├── Signin.jsx
    │   │   │   └── Signup.jsx
    │   │   ├── Recruiter/            # Recruiter dashboard
    │   │   │   ├── RecruiterLanding.jsx
    │   │   │   └── RecruiterCompanyPage.jsx
    │   │   ├── Jobseaker/            # Job seeker dashboard
    │   │   │   ├── JobSeekerLanding.jsx
    │   │   │   └── JobSeekerPreferences.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── InterviewScreen.jsx
    │   │   ├── InterviewScheduler.jsx
    │   │   ├── ProjectScreen.jsx
    │   │   ├── ProjectSubmission.jsx
    │   │   ├── InterviewTester.jsx
    │   │   └── proctoredreport.jsx
    │   ├── Components/               # Reusable components
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── AuthRedirect.jsx      # Auth redirect wrapper
    │   │   ├── AnalyzerPage.jsx
    │   │   ├── CandidateCard.jsx
    │   │   ├── CandidatesList.jsx
    │   │   ├── JobCard.jsx
    │   │   ├── JobListPanel.jsx
    │   │   └── ...
    │   ├── Context/                  # State management
    │   │   └── AuthContext.jsx
    │   ├── Services/                 # API services
    │   │   └── database.js
    │   ├── lib/
    │   │   └── supabaseClient.js
    │   ├── App.jsx                   # Main app component
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    └── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ (Frontend)
- Python 3.8+ (Backend)
- Supabase account
- OpenAI/Claude API key

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Create a `.env` file in `Backend/`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   FRONTEND_URL=http://localhost:5173
   LLM_API_KEY=your_llm_api_key
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_app_password
   ```

3. **Run the Backend**
   ```bash
   cd app
   python main.py
   # or
   uvicorn app.main:app --reload
   ```
   Backend runs on `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd front-end
   npm install
   ```

2. **Environment File**
   Create `.env` in `front-end/`:
   ```
   VITE_BACKEND_URL=http://localhost:8000
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 📚 API Documentation

### Core Endpoints

**Applications**
- `POST /applications/analyze-and-save-application` - Analyze resume and save
- `POST /applications/process-due-screenings` - Process pending screenings
- `POST /applications/send-shortlist-notifications` - Send emails
- `POST /applications/schedule-interview` - Schedule interview
- `POST /applications/submit-project` - Submit project
- `POST /applications/send-offer-email` - Send offer email
- `POST /applications/send-rejection-email` - Send rejection email
- `GET /applications/candidates/{job_id}` - Get candidates

**Recruiter**
- `POST /recruiter/jobs` - Create job opening
- `GET /recruiter/jobs` - List jobs

**Interview**
- `POST /interview/schedule` - Schedule interview
- `GET /interview/{app_id}` - Get details

**Proctor**
- `POST /proctor/start-session` - Start proctoring
- `POST /proctor/validate-session` - Validate session

## 🔐 Authentication Flow

1. **Sign Up**: User creates account with email, password, role
2. **Sign In**: User logs in, receives JWT token
3. **Token Storage**: Token stored in localStorage
4. **Protected Routes**: Routes protected with `ProtectedRoute` component
5. **Role-based Redirect**: Already signed-in users redirected to dashboard
   - Recruiter → `/recruiter`
   - Job Seeker → `/jobseeker`
6. **Auth Redirect**: Prevents authenticated users from accessing `/signin` and `/signup`

## 🤖 AI/ML Features

### Resume Analysis
- Text extraction from PDF/DOC
- Job description matching
- Skill analysis
- Match score calculation (0-100)
- Profile summary generation

### Proctoring System
- **Face Detection**: Real-time face detection
- **Eye Tracking**: Attention monitoring
- **Face Spoofing**: Prevents fake faces
- **Head Pose**: Detects looking away
- **Mouth Opening**: Reading detection
- **Phone Detection**: Detects mobile devices

## 🗄️ Database Schema (Supabase)

### Tables
- **users** - User accounts, roles, profiles
- **recruiter_job_openings** - Job postings, requirements
- **job_applications** - Applications, resume analysis
- **interviews** - Interview records, scheduling
- **proctoring_sessions** - Proctoring data, flags

## 📧 Email Service

**Triggers**:
- Shortlist email (match_score ≥ 60)
- Rejection email (match_score < 60)
- Interview reminder
- Project assignment
- Offer email
- Rejection email

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude/OpenAI API
- **Proctoring**: OpenCV, MediaPipe, TensorFlow
- **Email**: SMTP
- **Storage**: Supabase Storage

### Frontend
- **Framework**: React 18+
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Context API
- **HTTP**: Axios/Fetch
- **Icons**: Lucide React
- **DB Client**: Supabase JS

## 🔄 Application Workflow

```
1. Job Seeker Registers
   ↓
2. Recruiter Posts Job
   ↓
3. Job Seeker Applies (Upload Resume)
   ↓
4. AI Analyzes Resume (Background)
   ↓
5. Shortlist Email Sent (if score ≥ 60%)
   ↓
6. Interview Scheduled
   ↓
7. Proctored Interview
   ↓
8. Project Assignment (Optional)
   ↓
9. Final Decision (Offer/Rejection)
```

## 📦 Build & Deployment

### Backend
```bash
# Local
python app/main.py

# Production (Heroku/Railway)
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

### Frontend
```bash
npm run build
# Deploy to Vercel/Netlify/GitHub Pages
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Resume download fails | Check Supabase storage permissions |
| Proctoring not working | Ensure camera permissions + OpenCV installed |
| Email not sending | Verify SMTP credentials, Gmail needs app password |
| Auth not persisting | Check localStorage in browser console |
| API 500 errors | Review backend logs, check .env variables |

## 📝 Project Status

- ✅ Authentication & Role-based Access
- ✅ Resume Upload & AI Analysis
- ✅ Job Posting & Management
- ✅ Interview Scheduling
- ✅ Proctored Interviews
- ✅ Project Submission
- ✅ Email Notifications
- ✅ Candidate Reporting

## 📞 Development

**Team**: Final Year Project
**Date**: May 2026
**Status**: Complete

---
