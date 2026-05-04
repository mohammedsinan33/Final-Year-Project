export default function JobDetailPanel({
  selectedJob,
  hasApplied,
  hasTask,
  taskDescription,
  taskLinkDrafts,
  taskLinks,
  taskStatuses,
  selectedJobId,
  selectedRecruiterId,
  onTaskDraftChange,
  onTaskSubmit,
  onApplyClick,
}) {
  if (!selectedJob) {
    return (
      <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-8 text-center border border-emerald-100">
        <p className="text-gray-400">Select a job to view details</p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-8 border border-emerald-100 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Job Header */}
      <div className="mb-8 pb-6 border-b-2 border-emerald-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {selectedJob.role_title || "Untitled Role"}
        </h1>
        <p className="text-lg text-emerald-600 font-semibold">
          {selectedJob.company_name || selectedJob.company || "Company Name"}
        </p>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Employment Type</p>
          <p className="text-base font-semibold text-gray-900 mt-2">{selectedJob.job_type || "Full-time"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Location</p>
          <p className="text-base font-semibold text-gray-900 mt-2">{selectedJob.job_location || "Remote"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Experience</p>
          <p className="text-base font-semibold text-gray-900 mt-2">{selectedJob.years_of_experience || 0}+ years</p>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Compensation</p>
          <p className="text-base font-semibold text-gray-900 mt-2">{selectedJob.compensation || "Negotiable"} LPA</p>
        </div>
        
        {selectedJob.headcount && (
          <div className="col-span-1">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Openings</p>
            <p className="text-base font-semibold text-gray-900 mt-2">{selectedJob.headcount}</p>
          </div>
        )}
      </div>

      {/* Description */}
      {selectedJob.description && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About This Role</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
            {selectedJob.description}
          </p>
        </div>
      )}

      {/* Required Skills */}
      {(() => {
        const rawSkills = selectedJob.skills_needed;
        
        const skillsArray = Array.isArray(rawSkills) 
          ? rawSkills 
          : typeof rawSkills === 'string' 
            ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        if (skillsArray.length === 0) {
          return (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-500">No specific skills listed</p>
            </div>
          );
        }

        return (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skillsArray.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 text-emerald-700 rounded-full text-sm font-semibold hover:shadow-md transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      

      {/* Action Button */}
      <div className="mt-8 pt-6 border-t-2 border-emerald-100">
        {hasApplied ? (
          <div className="p-4 bg-green-100 border-2 border-green-600 text-green-700 rounded-lg text-center font-bold">
            Application Submitted
          </div>
        ) : (
          <button
            type="button"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-lg font-bold transition transform hover:-translate-y-1 shadow-lg"
            disabled={!selectedJobId}
            onClick={onApplyClick}
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}