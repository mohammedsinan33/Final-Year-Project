import { Plus } from "lucide-react";

export default function CreateJobModal({
  open,
  onClose,
  busy,
  onSubmit,
  formState,
  setFormState,
}) {
  const {
    roleTitle,
    compensation,
    description,
    skillsNeeded,
    jobType,
    jobLocation,
    hasProjectAssignment,
    projectDescription,
    yearsOfExperience,
    headcount,
    applicationDeadline,
    screeningStartDate,
    screeningEndDate,
  } = formState;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 my-8">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-emerald-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Create Job Opening</h3>
            <p className="text-sm text-gray-600 mt-1">Add a new position to your job board</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <form className="p-6 space-y-6 max-h-[70vh] overflow-y-auto" onSubmit={onSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Role Title *</label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={roleTitle}
                onChange={(e) => setFormState({ ...formState, roleTitle: e.target.value })}
                placeholder="e.g., Senior Frontend Developer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Compensation</label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={compensation}
                onChange={(e) => setFormState({ ...formState, compensation: e.target.value })}
                placeholder="e.g., ₹8–12 LPA"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Job Description *</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 resize-none min-h-[100px]"
              value={description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Describe the role and responsibilities..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Skills Required</label>
            <input
              className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              value={skillsNeeded}
              onChange={(e) => setFormState({ ...formState, skillsNeeded: e.target.value })}
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Job Type *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={jobType}
                onChange={(e) => setFormState({ ...formState, jobType: e.target.value })}
                required
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            {jobType !== "Remote" && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Location *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                  value={jobLocation}
                  onChange={(e) => setFormState({ ...formState, jobLocation: e.target.value })}
                  placeholder="e.g., Bengaluru"
                  required={jobType !== "Remote"}
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Years of Experience *</label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={yearsOfExperience}
                onChange={(e) => setFormState({ ...formState, yearsOfExperience: e.target.value })}
                type="number"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Headcount *</label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={headcount}
                onChange={(e) => setFormState({ ...formState, headcount: e.target.value })}
                type="number"
                min={1}
                required
              />
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Application Deadline *</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={applicationDeadline}
                onChange={(e) => setFormState({ ...formState, applicationDeadline: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Resume Screening Start Date *</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={screeningStartDate}
                onChange={(e) => setFormState({ ...formState, screeningStartDate: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={hasProjectAssignment}
              onChange={(e) => setFormState({ ...formState, hasProjectAssignment: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-emerald-300 text-emerald-600 cursor-pointer"
            />
            <span className="text-gray-900 font-medium">Include a screening project task</span>
          </label>

          {hasProjectAssignment && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Project Screening Start Date *</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                  value={screeningEndDate}
                  onChange={(e) => setFormState({ ...formState, screeningEndDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Project Description *</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 resize-none min-h-[100px]"
                  value={projectDescription}
                  onChange={(e) => setFormState({ ...formState, projectDescription: e.target.value })}
                  placeholder="Describe the screening project task..."
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t-2 border-emerald-100">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-emerald-300 hover:bg-emerald-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={20} /> Create Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}