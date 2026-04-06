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
      <div className="sticky top-24 bg-white rounded-2xl shadow-xl p-12 text-center border border-emerald-100">
        <p className="text-gray-500 text-lg">Select a job to view details</p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Job Header */}
      <div className="mb-6 pb-6 border-b border-emerald-100">
        <h1 className="text-4xl font-black text-gray-900 mb-2">
          {selectedJob.title || selectedJob.role_title}
        </h1>
        <p className="text-xl text-emerald-600 font-semibold">
          {selectedJob.company_name || selectedJob.company || "Company"}
        </p>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">📋 Type</p>
          <p className="text-sm font-bold text-emerald-700">{selectedJob.job_type || "Full-time"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">📍 Location</p>
          <p className="text-sm font-bold text-emerald-700">{selectedJob.job_location || "Remote"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">🎓 Experience</p>
          <p className="text-sm font-bold text-emerald-700">{selectedJob.years_of_experience || 0}+ years</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">💰 Compensation (Pay)</p>
          <p className="text-sm font-bold text-emerald-700">{selectedJob.compensation || "Negotiable"}</p>
        </div>
        {selectedJob.application_deadline && (
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">⏰ Application Deadline</p>
            <p className="text-sm font-bold text-red-600">
              {new Date(selectedJob.application_deadline).toLocaleString([], { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {selectedJob.description && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">About This Role</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {selectedJob.description}
          </p>
        </div>
      )}

      {/* Required Skills */}
      {(() => {
        const rawSkills = selectedJob.skills_needed || selectedJob.skillsNeeded || selectedJob.skills;
        
        // Handle if it comes as an array natively or a comma-separated string
        const skillsArray = Array.isArray(rawSkills) 
          ? rawSkills 
          : typeof rawSkills === 'string' 
            ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        if (skillsArray.length === 0) {
          return (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 text-center">
              <p className="text-sm text-gray-600">No specific skills listed for this position</p>
            </div>
          );
        }

        return (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">👨‍💻 Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skillsArray.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 text-emerald-700 rounded-full text-sm font-semibold hover:shadow-md transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Project Assignment Info (only after applying) */}
      {hasApplied && hasTask && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <h3 className="text-lg font-bold text-amber-900 mb-2">🎯 Project Assignment Required</h3>
          <p className="text-amber-800 mb-3">{taskDescription || "Screening project details will be shared soon."}</p>
          {selectedJob.project_screening_start_date && (
            <p className="text-sm text-amber-600 mb-3">
              <strong>Project Starts:</strong>{' '}
              {new Date(selectedJob.project_screening_start_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
          
          {/* Project Link Submission */}
          <div className="space-y-3 mt-4">
            <label className="text-sm font-semibold text-amber-900">Submit Your Project Link</label>
            <input
              className="w-full rounded-lg px-3 py-2 border border-amber-300 bg-amber-50 text-gray-900 placeholder-gray-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
              type="url"
              placeholder="https://github.com/yourname/project"
              value={taskLinkDrafts[selectedJobId] || ''}
              onChange={(e) => onTaskDraftChange(e.target.value)}
            />
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer text-sm transition-colors"
              onClick={onTaskSubmit}
            >
              Submit Project Link
            </button>
          </div>

          {taskLinks[selectedJobId] && (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-700">
              ✓ <strong>Submitted:</strong> {taskLinks[selectedJobId]}
            </div>
          )}
          {taskStatuses[selectedJobId] && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
              ⚠️ {taskStatuses[selectedJobId]}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-emerald-100">
        {hasApplied ? (
          <div className="p-3 bg-green-100 border-2 border-green-600 text-green-700 rounded-lg text-center font-bold">
            ✓ Application Submitted
          </div>
        ) : (
          <button
            type="button"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
            disabled={!selectedJobId}
            onClick={onApplyClick}
          >
            🚀 Apply Now
          </button>
        )}
      </div>
    </div>
  );
}
