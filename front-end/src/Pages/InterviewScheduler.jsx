import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchJobDetails, scheduleInterview } from "../Services/database";

const InterviewScheduler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  const appId = searchParams.get("app_id");
  const jobId = searchParams.get("job_id");

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        const jobData = await fetchJobDetails(jobId);
        setJob(jobData);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split("T")[0]);
        setSelectedTime("10:00");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const handleScheduleInterview = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time");
      return;
    }

    const localDate = new Date(`${selectedDate}T${selectedTime}:00`);
    const scheduledDateTime = localDate.toISOString();

    setScheduling(true);
    try {
      await scheduleInterview(appId, scheduledDateTime);
      setScheduled(true);
    } catch (err) {
      console.error("Full error:", err);
      alert(`Error scheduling interview: ${err.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const formatDateAndTime = () => {
    const date = new Date(`${selectedDate}T${selectedTime}`);
    return {
      date: date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      time: date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center max-w-md">
          <p className="text-lg text-red-600 font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center max-w-md">
          <p className="text-lg text-red-600 font-semibold">Job not found</p>
        </div>
      </div>
    );
  }

  if (scheduled) {
    const { date, time } = formatDateAndTime();
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Interview Scheduled!
            </h1>
            <p className="text-lg text-gray-600">
              Your interview has been successfully scheduled
            </p>
          </div>

          {/* Scheduled Details */}
          <div className="bg-green-50 p-8 rounded-lg border-l-4 border-green-600 mb-8">
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Position</p>
                <p className="text-2xl font-bold text-gray-900">{job.role_title}</p>
              </div>
              <hr className="border-green-200" />
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">📅 Date</p>
                  <p className="text-lg font-semibold text-green-600">{date}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">🕐 Time</p>
                  <p className="text-lg font-semibold text-green-600">{time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 mb-8">
            <p className="text-gray-800">
              ✉️ <span className="font-semibold">A confirmation email has been sent</span> to your registered email address.
            </p>
            <p className="text-gray-700 mt-3">
              The email will contain your interview link and additional details. Please check your inbox (and spam folder) shortly.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-8">
            <p className="text-sm text-gray-700">
              ℹ️ <span className="font-semibold">Interview Duration:</span> Approximately 30-45 minutes
            </p>
            <p className="text-sm text-gray-700 mt-2">
              ℹ️ <span className="font-semibold">Format:</span> Video call via our platform
            </p>
            <p className="text-sm text-gray-700 mt-2">
              ℹ️ <span className="font-semibold">Preparation:</span> Ensure stable internet and a quiet environment
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/jobseeker-landing")}
              className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold py-3 px-12 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              Done ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 py-12 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Congratulations!
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            You've been <span className="font-semibold text-green-600">shortlisted</span> for the interview
          </p>
        </div>

        {/* Job Info */}
        <div className="bg-blue-50 p-6 md:p-8 rounded-lg border-l-4 border-blue-600 mb-8">
          <p className="text-gray-700">
            Position: <span className="font-bold text-blue-600 text-lg">{job.role_title}</span>
          </p>
        </div>

        {/* Schedule Form */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Schedule Your Interview
          </h2>

          <div className="space-y-6">
            {/* Date Input */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Interview Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-gray-700"
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-gray-700"
              />
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-gray-700">
                ℹ️ <span className="font-semibold">Interview Duration:</span> Approximately 30-45 minutes
              </p>
              <p className="text-sm text-gray-700 mt-2">
                ℹ️ <span className="font-semibold">Format:</span> Video call via our platform
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleScheduleInterview}
            disabled={scheduling}
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            {scheduling ? "Scheduling..." : "Schedule Interview"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;