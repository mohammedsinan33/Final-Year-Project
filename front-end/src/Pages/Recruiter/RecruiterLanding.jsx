import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  createRecruiterJobOpening,
  getCurrentUser,
  listRecruiterJobOpenings,
  logout,
}from "../../Services/database";

export default function RecruiterLandingPage() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const [roleTitle, setRoleTitle] = useState("");
  const [compensation, setCompensation] = useState("");
  const [description, setDescription] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [jobLocation, setJobLocation] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [screeningStartDate, setScreeningStartDate] = useState("");
  const [screeningEndDate, setScreeningEndDate] = useState("");
  const [hasProjectAssignment, setHasProjectAssignment] = useState(false);
  const [projectDescription, setProjectDescription] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [headcount, setHeadcount] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUser();
        if (mounted) setUser(u);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id || user.role !== "recruiter") {
        if (mounted) setLoadingJobs(false);
        return;
      }

      try {
        setLoadingJobs(true);
        const items = await listRecruiterJobOpenings();
        if (mounted) setJobs(items);
      } catch (e) {
        if (mounted) setError(e?.message || "Could not load job openings.");
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "recruiter") return <Navigate to="/" replace />;

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : "";
  const displayName = firstName || user?.fullName || user?.email;

  function resetForm() {
    setRoleTitle("");
    setCompensation("");
    setDescription("");
    setSkillsNeeded("");
    setJobType("Full-time");
    setJobLocation("");
    setApplicationDeadline("");
    setScreeningStartDate("");
    setScreeningEndDate("");
    setHasProjectAssignment(false);
    setProjectDescription("");
    setYearsOfExperience(0);
    setHeadcount(1);
  }

  async function onCreateJob(e) {
    e?.preventDefault?.();
    setError("");
    
    // Validation
    if (jobType !== "Remote" && !jobLocation.trim()) {
      setError("Job location is required for non-remote positions.");
      return;
    }

    setBusy(true);
    try {
      await createRecruiterJobOpening({
        roleTitle,
        compensation,
        description,
        skillsNeeded,
        jobType,
        jobLocation: jobType === "Remote" ? "Remote" : jobLocation,
        applicationDeadline,
        screeningStartDate,
        screeningEndDate,
        hasProjectAssignment,
        projectDescription,
        yearsOfExperience,
        headcount,
      });
      const items = await listRecruiterJobOpenings();
      setJobs(items);
      setOpenModal(false);
      resetForm();
    } catch (err) {
      setError(err?.message || "Could not create job opening.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="page-card max-w-6xl mx-auto">
        <div className="rc-topRow mb-8">
          <div className="mb-6">
            <h1 className="page-title text-4xl font-bold text-white mb-2">Recruiter Dashboard</h1>
            <p className="page-subtitle text-lg text-slate-300">Welcome <span className="font-semibold text-indigo-400">{displayName}</span></p>
          </div>

          <div className="page-actions flex gap-3 flex-wrap">
            <button
              type="button"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-indigo-500/50"
              onClick={() => {
                setOpenModal(true);
                setError("");
              }}
            >
              + Add job opening
            </button>
            <button
              type="button"
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200"
              onClick={() => {
                (async () => {
                  await logout();
                  nav("/auth", { replace: true });
                })();
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div className="rc-error mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-200 font-semibold" role="alert">
            {error}
          </div>
        ) : null}

        <div className="rc-shell bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur">
          <h2 className="page-subtitle text-2xl font-bold text-white mb-6" style={{ margin: 0 }}>
            Your job openings
          </h2>

          {loadingJobs ? (
            <div className="rc-jobCard bg-slate-700/30 border border-slate-600/30 rounded-xl p-6 text-center text-slate-300 font-medium">
              Loading…
            </div>
          ) : jobs.length === 0 ? (
            <div className="rc-jobCard bg-slate-700/30 border border-slate-600/30 rounded-xl p-6 text-center text-slate-300 font-medium">
              No job openings yet. Click "Add job opening".
            </div>
          ) : (
            <div className="rc-jobs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((j) => (
                <div key={j.id} className="rc-jobCard bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10">
                  <p className="rc-jobTitle text-lg font-bold text-white mb-3">{j.role_title}</p>
                  <div className="rc-jobMeta text-sm text-slate-300 mb-2 leading-relaxed">
                    <span className="text-purple-300 font-semibold">💼 {j.job_type || "Full-time"}</span> • {j.job_location || "Remote"}
                  </div>
                  <div className="rc-jobMeta text-sm text-slate-300 mb-2 leading-relaxed">
                    {j.compensation ? <span className="text-indigo-300 font-semibold">{j.compensation}</span> : null}
                    {j.compensation ? " • " : ""}
                    <span>Experience: {j.years_of_experience}+ yrs</span> • <span>Hiring: {j.headcount}</span>
                  </div>
                  <div className="rc-jobMeta text-xs text-slate-400 pt-3 border-t border-slate-600/30">
                    <div className="mb-1"><strong>Deadline:</strong> {j.application_deadline || "—"}</div>
                    <div><strong>Screening:</strong> {j.screening_start_date || "—"} to {j.screening_end_date || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {openModal ? (
        <div
          className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add job opening"
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            setOpenModal(false);
          }}
        >
          <div className="w-full max-w-[720px] max-h-[85vh] rounded-2xl border border-white/10 bg-black/98 overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3 px-3.5 py-3 border-b border-white/10">
              <div>
                <div className="text-base font-black text-white">Create a job opening</div>
                <div className="mt-1 text-xs opacity-80 text-white">Add role and hiring details.</div>
              </div>
              <button type="button" className="border-none bg-transparent text-white text-2xl leading-none p-1 opacity-85 hover:opacity-100" aria-label="Close" onClick={() => setOpenModal(false)}>
                ×
              </button>
            </div>

            <form className="p-3.5 overflow-auto flex-1 grid gap-3" onSubmit={onCreateJob}>
              <div className="grid gap-3 grid-cols-1">
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Role title <span className="text-red-400">*</span></span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} required />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Compensation (optional)</span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={compensation} onChange={(e) => setCompensation(e.target.value)} placeholder="e.g., ₹8–12 LPA" />
                  </label>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-xs opacity-85 font-semibold text-white">Job description <span className="text-red-400">*</span></span>
                  <textarea className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 resize-vertical min-h-[110px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs opacity-85 font-semibold text-white">Skills needed (optional)</span>
                  <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={skillsNeeded} onChange={(e) => setSkillsNeeded(e.target.value)} placeholder="e.g., React, SQL, Git" />
                </label>

                {/* Job Type and Location */}
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Job Type <span className="text-red-400">*</span></span>
                    <select className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={jobType} onChange={(e) => setJobType(e.target.value)} required>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </label>

                  {jobType !== "Remote" && (
                    <label className="grid gap-1.5">
                      <span className="text-xs opacity-85 font-semibold text-white">Job Location <span className="text-red-400">*</span></span>
                      <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., Bengaluru, New York, London" required={jobType !== "Remote"} />
                    </label>
                  )}
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Application deadline (optional)</span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} type="date" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Years of experience <span className="text-red-400">*</span></span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} type="number" min={0} step="1" required />
                  </label>
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Initial screening start (optional)</span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={screeningStartDate} onChange={(e) => setScreeningStartDate(e.target.value)} type="date" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Initial screening end (optional)</span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={screeningEndDate} onChange={(e) => setScreeningEndDate(e.target.value)} type="date" />
                  </label>
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Hiring count <span className="text-red-400">*</span></span>
                    <input className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20" value={headcount} onChange={(e) => setHeadcount(e.target.value)} type="number" min={1} step="1" required />
                  </label>
                  <div className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Project assignment</span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={hasProjectAssignment}
                        onChange={(e) => setHasProjectAssignment(e.target.checked)}
                        id="rcHasProject"
                      />
                      <label htmlFor="rcHasProject" className="text-sm text-white">Include a project task in screening</label>
                    </div>
                  </div>
                </div>

                {hasProjectAssignment ? (
                  <label className="grid gap-1.5">
                    <span className="text-xs opacity-85 font-semibold text-white">Project description <span className="text-red-400">*</span></span>
                    <textarea
                      className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-white outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20 resize-vertical min-h-[110px]"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      required
                      placeholder="Describe the project task candidates must complete."
                    />
                  </label>
                ) : null}
              </div>

              <div className="px-3.5 py-3 border-t border-white/10 flex justify-end gap-2.5 flex-none">
                <button type="button" className="rounded-xl px-3 py-2.5 border border-white/10 bg-white/5 text-white cursor-pointer disabled:opacity-60 hover:bg-white/10" onClick={() => setOpenModal(false)} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-white cursor-pointer disabled:opacity-60 hover:bg-indigo-500/20" disabled={busy}>
                  {busy ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
