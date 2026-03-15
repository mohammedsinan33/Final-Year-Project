import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const Finalrport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sessionId, setSessionId] = useState("");
  const [finalReport, setFinalReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const sid =
      searchParams.get("sessionId") ||
      localStorage.getItem("lastProctorSessionId") ||
      localStorage.getItem("activeProctorSessionId") ||
      "";

    setSessionId(sid);

    const loadFinalReport = async () => {
      if (!sid) {
        setError("No session found.");
        setLoading(false);
        return;
      }

      try {
        const transcript = JSON.parse(localStorage.getItem(`interviewTranscript:${sid}`) || "[]");
        const proctorEvents = JSON.parse(localStorage.getItem(`proctorReport:${sid}`) || "[]");
        const interviewContext = JSON.parse(localStorage.getItem("interviewContext") || "{}");

        const res = await fetch(`${API_BASE_URL}/final-report/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to generate final report");
        }

        const data = await res.json();
        setFinalReport(data.report || null);
      } catch (e) {
        setError(e.message || "Could not load final report");
      } finally {
        setLoading(false);
      }
    };

    loadFinalReport();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-800">Generating Final Report...</h1>
        </div>
      </div>
    );
  }

  if (error || !finalReport) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Final Report Unavailable</h1>
          <p className="text-gray-600 mb-6">{error || "No final report data found."}</p>
          <button onClick={() => navigate("/")} className="text-blue-600 hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Final Interview Report</h1>
        <p className="text-gray-500 mb-8">Session ID: {sessionId || "N/A"}</p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-blue-800">Overall Score</h3>
            <div className="text-5xl font-bold my-2 text-blue-700">{finalReport.overall_score ?? 0}%</div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-800">Suitability</h3>
            <div className="text-2xl font-bold my-2 text-gray-800">
              {finalReport.suitability_level || "N/A"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Technical Score</h4>
            <p className="text-2xl font-bold text-green-700">{finalReport.technical_score ?? 0}%</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="font-semibold text-indigo-800">Communication Score</h4>
            <p className="text-2xl font-bold text-indigo-700">{finalReport.communication_score ?? 0}%</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Final Summary</h2>
          <p className="text-gray-700">{finalReport.final_summary || "No summary available."}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Strengths</h2>
          <ul className="list-disc pl-6 text-gray-700">
            {(finalReport.strengths || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Improvement Areas</h2>
          <ul className="list-disc pl-6 text-gray-700">
            {(finalReport.improvement_areas || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 hover:underline">
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Finalrport;