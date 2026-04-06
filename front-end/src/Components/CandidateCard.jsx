import { ChevronDown, ChevronUp, FileText, Code, TrendingUp } from "lucide-react";

export default function CandidateCard({
  candidate,
  expanded,
  onToggle,
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-600 transition">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/50 transition"
      >
        <div className="text-left flex-1">
          <div className="flex items-center gap-3">
            <h5 className="text-lg font-bold text-gray-900">{candidate.name}</h5>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                candidate.status === "shortlisted"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {candidate.status === "shortlisted" ? "✓ Shortlisted" : "✗ Not Shortlisted"}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <span>
                Resume: <strong className="text-gray-900">{candidate.resume_score}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Code size={16} className="text-purple-600" />
              <span>
                Repo: <strong className="text-gray-900">{candidate.repo_score}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <span>
                Interview:{" "}
                <strong className="text-gray-900">
                  {candidate.interview_score ? `${candidate.interview_score}%` : "Pending"}
                </strong>
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={24} className="text-emerald-600" />
        ) : (
          <ChevronDown size={24} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t-2 border-gray-200 p-4 bg-gray-50 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Email</p>
              <p className="text-gray-900">{candidate.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Phone</p>
              <p className="text-gray-900">{candidate.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Skills</p>
              <p className="text-gray-900">{candidate.skills}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Experience</p>
              <p className="text-gray-900">{candidate.experience} years</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-emerald-200">
            <h6 className="font-bold text-gray-900 mb-3">Screening Task Status</h6>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Task Status</p>
                <p
                  className={`font-bold mt-1 ${
                    candidate.task_status === "completed"
                      ? "text-green-600"
                      : candidate.task_status === "pending"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {candidate.task_status === "completed"
                    ? "✓ Completed"
                    : candidate.task_status === "pending"
                    ? "⏳ Pending"
                    : "Not Started"}
                </p>
              </div>
              {candidate.task_link && (
                <a
                  href={candidate.task_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                  View Submission
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold transition">
              Send Interview Invite
            </button>
            <button className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-bold transition">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}