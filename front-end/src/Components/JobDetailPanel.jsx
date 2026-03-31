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
      <div className="sticky top-6 border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-left shadow-xl">
        <div className="p-4 text-slate-400 text-center font-medium">Select a job to see details.</div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-left max-h-[85vh] overflow-y-auto shadow-xl">
      {/* Job Title */}
      <h2 className="m-0 text-2xl font-black text-white mb-1">
        {selectedJob.title || selectedJob.role_title}
      </h2>
      
      {/* Company Name */}
      <div className="text-slate-300 text-sm mb-4 font-semibold">
        🏢 {selectedJob.company_name || selectedJob.company || "Company"}
      </div>

      {/* Job Type and Location - Separate */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Job Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide min-w-[80px]">
            📋 Type:
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full border border-blue-400/50 bg-blue-500/20 text-blue-200 font-semibold">
            {selectedJob.job_type || "Full-time"}
          </span>
        </div>

        {/* Job Location */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide min-w-[80px]">
            📍 Location:
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 font-semibold">
            {selectedJob.job_location || "Remote"}
          </span>
        </div>
      </div>

      {/* Job Info Badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        <span className="text-xs px-3 py-1.5 rounded-full border border-indigo-400/50 bg-indigo-500/20 text-indigo-200 font-semibold">
          🎓 {selectedJob.years_of_experience || 0}+ years exp
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 text-amber-200 font-semibold">
          💰 {selectedJob.compensation || "Negotiable"}
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 text-amber-200 font-semibold">
          📅 {selectedJob.date_posted || "Recently posted"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700 mb-5"></div>

      {/* Overview */}
      {selectedJob.summary && (
        <div className="mb-5">
          <p className="m-0 text-xs font-bold text-indigo-300 uppercase tracking-wide mb-2">Overview</p>
          <p className="m-0 text-sm leading-relaxed text-slate-200">
            {selectedJob.summary}
          </p>
        </div>
      )}

      {/* Description */}
      {selectedJob.description && (
        <div className="mb-5">
          <p className="m-0 text-xs font-bold text-indigo-300 uppercase tracking-wide mb-2">Description</p>
          <p className="m-0 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
            {selectedJob.description}
          </p>
        </div>
      )}

      {/* Required Skills */}
      {selectedJob.skills_needed && (
        <div className="mb-5">
          <p className="m-0 text-xs font-bold text-indigo-300 uppercase tracking-wide mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {selectedJob.skills_needed.split(',').map((skill, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-200">
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Task Section */}
      {hasApplied && hasTask && (
        <div className="mb-5 p-4 bg-gradient-to-br from-amber-900/20 to-slate-800/30 border border-amber-500/30 rounded-xl">
          <p className="m-0 text-xs font-bold text-amber-300 uppercase tracking-wide mb-2">Project Assignment</p>
          <p className="m-0 text-sm text-slate-200 mb-3 leading-relaxed">
            {taskDescription || "Task details will be shared soon."}
          </p>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Submit Your Project Link</label>
            <input
              className="w-full rounded-lg px-3 py-2 border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-sm"
              type="url"
              placeholder="https://github.com/yourname/project"
              value={taskLinkDrafts[selectedJobId] || ""}
              onChange={(e) => onTaskDraftChange(e.target.value)}
            />
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer text-sm transition-colors"
              onClick={onTaskSubmit}
            >
              Submit Link
            </button>
          </div>
          {taskLinks[selectedJobId] && (
            <div className="mt-2 p-2 bg-emerald-900/30 border border-emerald-600/50 rounded text-xs text-emerald-200">
              ✓ Submitted: {taskLinks[selectedJobId]}
            </div>
          )}
          {taskStatuses[selectedJobId] && (
            <div className="mt-2 p-2 bg-red-900/30 border border-red-600/50 rounded text-xs text-red-200">
              ⚠️ {taskStatuses[selectedJobId]}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-2">
        {hasApplied ? (
          <div className="p-3 bg-emerald-900/20 border border-emerald-600/50 rounded-lg text-center">
            <p className="m-0 text-sm font-bold text-emerald-300">✓ Application Submitted</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="w-full rounded-lg px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base transition-all shadow-lg hover:shadow-indigo-500/50"
              disabled={!selectedJobId}
              onClick={onApplyClick}
            >
              🚀 Apply Now
            </button>
            <button
              type="button"
              className="w-full rounded-lg px-4 py-2.5 border border-slate-600 bg-slate-700/30 hover:bg-slate-700/60 text-slate-200 font-semibold cursor-pointer text-base transition-colors"
              onClick={() => alert("TODO: Save job")}
            >
              💾 Save Job
            </button>
          </>
        )}
      </div>
    </div>
  );
}
