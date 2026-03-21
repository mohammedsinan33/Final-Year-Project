import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import AnalyzerPage from "./Components/AnalyzerPage";
import InterviewScreen from "./Pages/InterviewScreen";
import InterviewTester from "./Pages/InterviewTester";
import ProctoredReport from "./Pages/proctoredreport";
import Finalrport from "./Pages/finalrport";
import Signin from "./Pages/Auth/Signin";
import Signup from "./Pages/Auth/Signup";
import JobSeekerLanding from "./Pages/Jobseaker/JobSeekerLanding";
import JobSeekerPreferences from "./Pages/Jobseaker/JobSeekerPreferences";
import RecruiterLanding from "./Pages/Recruiter/RecruiterLanding";
import RecruiterCompanyPage from "./Pages/Recruiter/RecruiterCompanyPage";
import "./App.css";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AnalyzerPage />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected JobSeeker Routes */}
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

          {/* Protected Recruiter Routes */}
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

          {/* Other Routes */}
          <Route path="/interview" element={<InterviewScreen />} />
          <Route path="/tester" element={<InterviewTester />} />
          <Route path="/proctored-report" element={<ProctoredReport />} />
          <Route path="/finalrport" element={<Finalrport />} />
          <Route path="*" element={<AnalyzerPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;