import { ChevronDown, ChevronUp, Users } from "lucide-react";
import CandidateCard from "./CandidateCard";

export default function JobCard({
  job,
  candidates,
  expanded,
  onToggle,
  selectedCandidate,
  onSelectCandidate,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 hover:border-emerald-600 transition">
      {/* Job Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-emerald-50/50 transition"
      >
        <div className="text-left flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.role_title}</h3>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span className="flex items-center gap-1">📍 {job.job_location || "Remote"}</span>
            <span className="flex items-center gap-1">💼 {job.job_type}</span>
            {job.compensation && <span className="flex items-center gap-1">💰 {job.compensation}</span>}
            <span className="flex items-center gap-1">👥 {job.headcount} position(s)</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={28} className="text-emerald-600" />
        ) : (
          <ChevronDown size={28} className="text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t-2 border-emerald-100 p-6 bg-emerald-50/30 space-y-6">
          {/* Job Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Skills Required</h4>
              <p className="text-gray-700">{job.skills_needed || "Not specified"}</p>
            </div>
          </div>

          {/* Status & Dates */}
          <div className="bg-white rounded-xl p-4 border border-emerald-200">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-semibold">Application Deadline</p>
                <p className="text-gray-900 mt-1">
                  {job.application_deadline
                    ? new Date(job.application_deadline).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Screening Period</p>
                <p className="text-gray-900 mt-1">
                  {job.screening_start_date ? new Date(job.screening_start_date).toLocaleDateString() : "Not set"} to{" "}
                  {job.screening_end_date ? new Date(job.screening_end_date).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Experience Required</p>
                <p className="text-gray-900 mt-1">{job.years_of_experience}+ years</p>
              </div>
            </div>
          </div>

          {/* Candidates List */}
          {candidates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} /> Candidates ({candidates.length})
              </h4>
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  expanded={selectedCandidate === candidate.id}
                  onToggle={() => onSelectCandidate(selectedCandidate === candidate.id ? null : candidate.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}