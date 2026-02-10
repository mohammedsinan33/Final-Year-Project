import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AnalyzerPage from "./Components/AnalyzerPage";
import InterviewScreen from "./Pages/InterviewScreen";
import "./App.css"; // Ensure styles are imported if needed

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<AnalyzerPage />} />
          <Route path="/interview" element={<InterviewScreen />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;