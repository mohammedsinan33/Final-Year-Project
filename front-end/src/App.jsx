import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AnalyzerPage from "./Components/AnalyzerPage";
import InterviewScreen from "./Pages/InterviewScreen";
import InterviewTester from "./Pages/InterviewTester";
import ProctoredReport from "./Pages/proctoredreport";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<AnalyzerPage />} />
          <Route path="/interview" element={<InterviewScreen />} />
          <Route path="/tester" element={<InterviewTester />} />
          <Route path="/proctored-report" element={<ProctoredReport />} />
          <Route path="*" element={<AnalyzerPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;