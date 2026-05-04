// front-end/src/Components/CandidateReportModal.jsx
import { useState } from "react";
import { X, CheckCircle, XCircle, Clock, Loader } from "lucide-react";

export default function CandidateReportModal({
  candidate,
  open,
  onClose,
  onSelect,
  onReject,
  jobTitle,
  companyName,
  loading,
}) {
  const [selectLoading, setSelectLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!open || !candidate) return null;

  const getStageIcon = (stage) => {
    switch (stage) {
      case "completed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      case "rejected":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (stage) => {
    switch (stage) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelect = async () => {
    setSelectLoading(true);
    setMessage("");
    try {
      await onSelect(candidate);
      setMessage("✅ Candidate selected! Offer email sent.");
      setTimeout(() => {
        onClose();
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSelectLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectLoading(true);
    setMessage("");
    try {
      await onReject(candidate);
      setMessage("✅ Candidate rejected. Email sent.");
      setTimeout(() => {
        onClose();
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{candidate.name}</h2>
            <p className="text-emerald-100">{candidate.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-emerald-500 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Phone</p>
              <p className="text-gray-900 mt-1">{candidate.phone || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Experience</p>
              {Array.isArray(candidate.experience) && candidate.experience.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Experience</h4>
                  <div className="space-y-2">
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <p className="font-semibold">{exp.role} at {exp.company}</p>
                        <p className="text-xs text-gray-600">{exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Position Applied</p>
              <p className="text-gray-900 mt-1">{jobTitle}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold">Skills</p>
              <p className="text-gray-900 mt-1 text-sm">{candidate.skills || "N/A"}</p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Application Progress</h3>
            <div className="space-y-3">
              {/* Resume Screening */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getStageIcon("completed")}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Resume Screening</p>
                  <p className="text-sm text-gray-600">Score: {candidate.match_score || 0}/100</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Completed
                </span>
              </div>

              {/* Repository Review */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getStageIcon(candidate.project_alignment_score ? "completed" : "pending")}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Project Review</p>
                  {candidate.project_alignment_score && (
                    <p className="text-sm text-gray-600">Score: {candidate.project_alignment_score}/100</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    candidate.project_alignment_score ? "completed" : "pending"
                  )}`}
                >
                  {candidate.project_alignment_score ? "Completed" : "Pending"}
                </span>
              </div>


              {/* Interview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getStageIcon(
                  candidate.interview_score !== null && candidate.interview_score !== undefined
                    ? "completed"
                    : "pending"
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Interview</p>
                  {candidate.interview_score !== null && candidate.interview_score !== undefined && (
                    <p className="text-sm text-gray-600">Rating: {candidate.interview_score}/5</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    candidate.interview_score !== null ? "completed" : "pending"
                  )}`}
                >
                  {candidate.interview_score !== null ? "Completed" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Interview Scores (if completed) */}
          {candidate.interview_score !== null && candidate.interview_score !== undefined && (
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border border-emerald-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Interview Assessment Scores</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Overall Score</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    {candidate.overall_score || candidate.interview_score * 20}/100
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Technical Score</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {candidate.technical_score || 0}/100
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Communication Score</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {candidate.communication_score || 0}/100
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Integrity Score</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {candidate.integrity_score || 0}/100
                  </p>
                </div>
              </div>

              {/* Eligibility Status */}
              {candidate.eligibility_status && (
                <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-emerald-600">
                  <p className="text-sm text-gray-600 font-semibold">Eligibility Status</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{candidate.eligibility_status}</p>
                  {candidate.eligibility_reasoning && (
                    <p className="text-sm text-gray-700 mt-2">{candidate.eligibility_reasoning}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg text-center font-semibold ${
                message.includes("✅")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Action Buttons */}
                {/* Action Buttons or Status Message */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          {candidate.selected === true ? (
            <div className="p-4 bg-green-50 border-2 border-green-400 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={28} />
                <div>
                  <p className="text-lg font-bold text-green-800">✅ Candidate Selected</p>
                  <p className="text-sm text-green-700">Offer email has been sent to the candidate</p>
                </div>
              </div>
            </div>
          ) : candidate.selected === false ? (
            <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={28} />
                <div>
                  <p className="text-lg font-bold text-red-800">❌ Candidate Rejected</p>
                  <p className="text-sm text-red-700">Rejection email has been sent to the candidate</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={rejectLoading || selectLoading || loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-lg transition"
              >
                {rejectLoading ? <Loader size={20} className="animate-spin" /> : <XCircle size={20} />}
                Reject
              </button>
              <button
                onClick={handleSelect}
                disabled={selectLoading || rejectLoading || loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-lg transition"
              >
                {selectLoading ? <Loader size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                Select & Send Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}