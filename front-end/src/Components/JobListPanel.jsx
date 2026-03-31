export default function JobListPanel({ filteredJobs, selectedJobId, onSelect }) {
  return (
    <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden">
      <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <h2 className="m-0 text-sm font-bold opacity-95">Job results</h2>
        <div className="text-xs opacity-75">{filteredJobs.length} found</div>
      </div>

      <div className="max-h-[calc(100vh-220px)] overflow-auto">
        {filteredJobs.length === 0 ? (
          <div className="p-3.5 opacity-80">No jobs match your search.</div>
        ) : (
          filteredJobs.map((job) => (
            <button
              key={job.id}
              type="button"
              className={`w-full text-left border-none bg-transparent text-inherit px-3.5 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 ${
                selectedJobId === job.id ? "bg-indigo-500/10 border-b-indigo-500/20" : ""
              }`}
              onClick={() => onSelect(String(job.id))}
            >
              <p className="m-0 text-sm font-bold">{job.title || job.role_title}</p>
              <p className="mt-1 mb-0 text-xs opacity-80">
                {job.company || ""}{job.location ? ` • ${job.location}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5">
                  {job.type || "—"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5">
                  {job.salary || job.compensation || "—"}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
