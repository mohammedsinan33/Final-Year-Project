export default function ResumeBuilderModal({
  open,
  buildBusy,
  buildError,
  buildUrl,
  resumeDraft,
  onClose,
  onBuild,
  onFieldChange,
  onListFieldUpdate,
  onListFieldAdd,
  onListFieldRemove,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Build resume"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        onClose();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[85vh] rounded-2xl border border-white/10 bg-black/98 overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 px-3.5 py-3 border-b border-white/10">
          <div>
            <div className="text-base font-black">Build your resume</div>
            <div className="mt-1 text-xs opacity-80">Fill out the form and we will create your resume draft.</div>
          </div>
          <button
            type="button"
            className="border-none bg-transparent text-inherit text-2xl leading-none p-1 opacity-85 hover:opacity-100"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-3.5 overflow-auto flex-1">
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onBuild(); }}>
            <div className="grid gap-3 grid-cols-1">
              <label className="grid gap-1.5">
                <span className="text-xs opacity-85">Name</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  type="text"
                  value={resumeDraft.fullName}
                  onChange={(e) => onFieldChange("fullName", e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs opacity-85">Mail ID</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  type="email"
                  value={resumeDraft.email}
                  onChange={(e) => onFieldChange("email", e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs opacity-85">GitHub profile (optional)</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  type="url"
                  value={resumeDraft.github}
                  onChange={(e) => onFieldChange("github", e.target.value)}
                  placeholder="https://github.com/username"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs opacity-85">LinkedIn profile (optional)</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  type="url"
                  value={resumeDraft.linkedin}
                  onChange={(e) => onFieldChange("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs opacity-85">Technical skills</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                type="text"
                value={resumeDraft.technicalSkills}
                onChange={(e) => onFieldChange("technicalSkills", e.target.value)}
                placeholder="React, Node.js, SQL"
              />
              <span className="text-xs opacity-70">Separate skills with commas.</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs opacity-85">Soft skills</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                type="text"
                value={resumeDraft.softSkills}
                onChange={(e) => onFieldChange("softSkills", e.target.value)}
                placeholder="Communication, teamwork, leadership"
              />
              <span className="text-xs opacity-70">Separate skills with commas.</span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs opacity-85">Interests</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                type="text"
                value={resumeDraft.interests}
                onChange={(e) => onFieldChange("interests", e.target.value)}
                placeholder="AI, open source, hackathons"
              />
            </label>

            {["education", "projects", "certifications", "experience", "keyPositions", "achievements"].map((field) => (
              <div key={field} className="grid gap-2.5 border border-white/10 rounded-xl p-3 bg-white/5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="text-xs font-bold opacity-90">
                    {field === "keyPositions" ? "Key positions" : field === "education" ? "Education" : field === "projects" ? "Projects" : field === "certifications" ? "Certifications" : field === "experience" ? "Experience" : "Achievements and activities"}
                  </div>
                  <button
                    type="button"
                    className="rounded-xl px-2.5 py-1.5 border border-indigo-500/55 bg-indigo-500/14 text-inherit text-xs cursor-pointer hover:bg-indigo-500/20"
                    onClick={() => onListFieldAdd(field)}
                  >
                    Add
                  </button>
                </div>
                {resumeDraft[field].map((value, index) => (
                  <div key={`${field}-${index}`} className="grid gap-2">
                    <textarea
                      className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      rows={field === "certifications" ? 2 : field === "keyPositions" ? 2 : field === "achievements" ? 2 : 3}
                      value={value}
                      onChange={(e) => onListFieldUpdate(field, index, e.target.value)}
                      placeholder={
                        field === "education"
                          ? "College, degree, year, grade"
                          : field === "projects"
                          ? "Project name, stack, outcome"
                          : field === "certifications"
                          ? "Certification name, issuer, year"
                          : field === "experience"
                          ? "Role, company, duration, key work"
                          : field === "keyPositions"
                          ? "Position, organization, year"
                          : "Achievement or activity"
                      }
                    />
                    <button
                      type="button"
                      className="rounded-xl px-2.5 py-1.5 border border-white/10 bg-white/5 text-inherit text-xs cursor-pointer hover:bg-white/10"
                      onClick={() => onListFieldRemove(field, index)}
                      aria-label={`Remove ${field}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <div className="flex justify-end gap-2.5 mt-1.5">
              <button
                type="button"
                className="rounded-xl px-3 py-2.5 border border-white/10 bg-white/5 text-inherit cursor-pointer text-sm hover:bg-white/10"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer text-sm disabled:opacity-55"
                disabled={buildBusy}
              >
                {buildBusy ? "Building..." : "Build resume"}
              </button>
            </div>

            {buildError && (
              <div className="text-xs p-2 rounded-lg bg-red-600/20 border border-red-600/35 mt-2.5">
                {buildError}
              </div>
            )}
            {buildUrl && (
              <div className="text-xs opacity-85 mt-2.5">
                Stored at:{" "}
                <a className="text-indigo-400 no-underline hover:underline" href={buildUrl} target="_blank" rel="noreferrer">
                  Open resume
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
