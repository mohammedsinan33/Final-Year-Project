import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
// ❌ REMOVE: import AuthRedirect from "./Components/AuthRedirect";
import AnalyzerPage from "./Components/AnalyzerPage";
import InterviewScreen from "./Pages/InterviewScreen";
import InterviewTester from "./Pages/InterviewTester";
import ProctoredReport from "./Pages/proctoredreport";
import Signin from "./Pages/Auth/Signin";
import Signup from "./Pages/Auth/Signup";
import JobSeekerLanding from "./Pages/Jobseaker/JobSeekerLanding";
import JobSeekerPreferences from "./Pages/Jobseaker/JobSeekerPreferences";
import RecruiterLanding from "./Pages/Recruiter/RecruiterLanding";
import RecruiterCompanyPage from "./Pages/Recruiter/RecruiterCompanyPage";
import ProjectScreen from "./Pages/ProjectScreen";
import InterviewScheduler from "./Pages/InterviewScheduler";
import ProjectSubmission from "./Pages/ProjectSubmission";
import FinalReport from "./Components/CandidateReport"
import "./App.css";
import Home from "./Pages/HomePage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* ✅ REMOVED AuthRedirect wrapper */}
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes remain the same */}
          <Route
            path="/jobseeker"
            element={
              <ProtectedRoute requiredRole="jobseeker">
                <JobSeekerLanding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobseeker/preferences"
            element={
              <ProtectedRoute requiredRole="jobseeker">
                <JobSeekerPreferences />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruiter"
            element={
              <ProtectedRoute requiredRole="recruiter">
                <RecruiterLanding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/company"
            element={
              <ProtectedRoute requiredRole="recruiter">
                <RecruiterCompanyPage />
              </ProtectedRoute>
            }
          />

          <Route path="/interview" element={<InterviewScreen />} />
          <Route path="/tester" element={<InterviewTester />} />
          <Route path="/interview-tester" element={<InterviewTester />} />
          <Route path="/proctored-report" element={<ProctoredReport />} />
          <Route path="/project" element={<ProjectScreen />} />
          <Route path="/project-submission" element={<ProjectSubmission />} />
          <Route path="/interview-scheduler" element={<InterviewScheduler />} />
          <Route path="*" element={<AnalyzerPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;