import { ChevronDown, Users, MapPin, Briefcase, DollarSign } from "lucide-react";
import CandidatesList from "./CandidatesList";

export default function JobCard({
  job,
  candidates,
  expanded,
  onToggle,
  onSelectCandidate,
  loadingCandidates,
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100 overflow-hidden hover:shadow-xl transition">
      {/* Job Header */}
      <div
        onClick={onToggle}
        className="p-6 cursor-pointer bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 transition"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.role_title}</h3>
            <p className="text-gray-600 line-clamp-2 mb-3">{job.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              {job.job_location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{job.job_location}</span>
                </div>
              )}
              {job.job_type && (
                <div className="flex items-center gap-1">
                  <Briefcase size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{job.job_type}</span>
                </div>
              )}
              {job.compensation && (
                <div className="flex items-center gap-1">
                  <DollarSign size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{job.compensation}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{candidates.length} Applications</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition transform flex-shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={24} />
          </button>
        </div>
      </div>

      {/* Expanded Content with Candidates List */}
      {expanded && (
        <div className="p-6 border-t-2 border-emerald-100 bg-gray-50">
          <CandidatesList
            candidates={candidates}
            onSelectCandidate={onSelectCandidate}
            loading={loadingCandidates}
          />
        </div>
      )}
    </div>
  );
}