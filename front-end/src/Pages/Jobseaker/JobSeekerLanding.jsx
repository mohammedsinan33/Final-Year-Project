import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { uploadResumeAndAnalyze, getCurrentUser, listPublicJobOpenings, logout } from "../../Services/database";
import { requireSupabase } from "../../lib/supabaseClient";
import { LogOut, Search, Briefcase, MapPin, DollarSign, Clock, FileText } from "lucide-react";
import JobHeader from "../../Components/JobHeader";
import JobSearchBar from "../../Components/JobSearchBar";
import JobListPanel from "../../Components/JobListPanel";
import JobDetailPanel from "../../Components/JobDetailPanel";
import ApplyModal from "../../Components/ApplyModal";
import ResumeBuilderModal from "../../Components/ResumeBuilderModal";

export default function JobSeekerLanding() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [remoteJobs, setRemoteJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDraft, setResumeDraft] = useState({
    fullName: "",
    email: "",
    github: "",
    linkedin: "",
    technicalSkills: "",
    softSkills: "",
    interests: "",
    education: [""],
    projects: [""],
    certifications: [""],
    experience: [""],
    keyPositions: [""],
    achievements: [""],
  });
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [buildBusy, setBuildBusy] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [buildUrl, setBuildUrl] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [taskLinkDrafts, setTaskLinkDrafts] = useState({});
  const [taskLinks, setTaskLinks] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});

  // Helper functions
  function updateListField(field, index, value) {
    setResumeDraft((s) => {
      const next = [...s[field]];
      next[index] = value;
      return { ...s, [field]: next };
    });
  }

  function addListField(field) {
    setResumeDraft((s) => ({ ...s, [field]: [...s[field], ""] }));
  }

  function removeListField(field, index) {
    setResumeDraft((s) => {
      const next = s[field].filter((_, i) => i !== index);
      return { ...s, [field]: next.length ? next : [""] };
    });
  }

  function normalizeList(list) {
    return (Array.isArray(list) ? list : []).map((item) => String(item || "").trim()).filter(Boolean);
  }

  function appliedStorageKey(userId) {
    return `jobseeker_applied_${userId}`;
  }

  function loadAppliedJobs(userId) {
    try {
      const raw = localStorage.getItem(appliedStorageKey(userId));
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
    } catch {
      return [];
    }
  }

  function persistAppliedJobs(userId, items) {
    try {
      localStorage.setItem(appliedStorageKey(userId), JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  async function resolveRecruiterId(jobId, recruiterId) {
    if (recruiterId) return recruiterId;
    if (!jobId) return "";
    try {
      const supabase = requireSupabase();
      const { data, error } = await supabase
        .from("recruiter_job_openings")
        .select("recruiter_id")
        .eq("id", jobId)
        .single();
      if (error) return "";
      return data?.recruiter_id || "";
    } catch {
      return "";
    }
  }

  async function handleUploadResume() {
    if (!resumeFile || uploadBusy) return;
    setUploadBusy(true);
    setUploadError("");
    setUploadUrl("");

    try {
      const jobId = selectedJob?.id || selectedJob?.job_id || selectedJob?.jobId || "";
      const candidateId = user?.id;
      const recruiterId = await resolveRecruiterId(
        jobId,
        selectedJob?.recruiter_id || selectedJob?.recruiterId || ""
      );

      if (!candidateId) throw new Error("User not found. Please log in again.");
      if (!jobId) throw new Error("Job ID is missing. Please refresh and try again.");
      if (!recruiterId) {
        throw new Error("Recruiter ID is missing for this job. Please open a job posted in the system.");
      }

      const result = await uploadResumeAndAnalyze({
        file: resumeFile,
        jobId,
        recruiterId,
        candidateId,
      });

      setUploadUrl("Analyzed and saved!");

      const jobIdStr = String(jobId);
      setAppliedJobIds((prev) => {
        const next = prev.includes(jobIdStr) ? prev : [...prev, jobIdStr];
        if (user?.id) persistAppliedJobs(user.id, next);
        return next;
      });
      setApplyOpen(false);

    } catch (err) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleBuildResume() {
    if (buildBusy) return;
    setBuildBusy(true);
    setBuildError("");
    setBuildUrl("");

    try {
      const payload = {
        full_name: resumeDraft.fullName,
        email: resumeDraft.email,
        github: resumeDraft.github,
        linkedin: resumeDraft.linkedin,
        technical_skills: resumeDraft.technicalSkills,
        soft_skills: resumeDraft.softSkills,
        interests: resumeDraft.interests,
        education: normalizeList(resumeDraft.education),
        projects: normalizeList(resumeDraft.projects),
        certifications: normalizeList(resumeDraft.certifications),
        experience: normalizeList(resumeDraft.experience),
        key_positions: normalizeList(resumeDraft.keyPositions),
        achievements: normalizeList(resumeDraft.achievements),
      };

      // const result = await buildResume(payload);
      // setBuildUrl(result.resume_url || "");
    } catch (err) {
      setBuildError(err?.message || "Could not build resume.");
    } finally {
      setBuildBusy(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUser();
        if (mounted) setUser(u);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setAppliedJobIds(loadAppliedJobs(user.id));
  }, [user?.id]);

  const [roleQuery, setRoleQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingJobs(true);
        const items = await listPublicJobOpenings();
        if (mounted) setRemoteJobs(items);
      } catch {
        if (mounted) setRemoteJobs([]);
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let channel = null;
    let canceled = false;

    try {
      const supabase = requireSupabase();
      channel = supabase
        .channel("jobseeker-openings")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "recruiter_job_openings" },
          async () => {
            if (canceled) return;
            try {
              const items = await listPublicJobOpenings();
              if (!canceled) setRemoteJobs(items);
            } catch {
              // ignore
            }
          }
        )
        .subscribe();
    } catch {
      // Supabase not configured
    }

    return () => {
      canceled = true;
      try {
        if (channel) {
          const supabase = requireSupabase();
          supabase.removeChannel(channel);
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const jobs = useMemo(() => (Array.isArray(remoteJobs) ? remoteJobs : []), [remoteJobs]);

  const filteredJobs = useMemo(() => {
    const q = String(roleQuery || "").trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => String(j.title || j.role_title || "").toLowerCase().includes(q));
  }, [jobs, roleQuery]);

  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!filteredJobs.length) {
      setSelectedId("");
      return;
    }
    const stillExists = filteredJobs.some((j) => String(j.id) === String(selectedId));
    if (!stillExists) setSelectedId(String(filteredJobs[0].id));
  }, [filteredJobs, selectedId]);

  const selectedJob = useMemo(() => {
    return filteredJobs.find((j) => String(j.id) === String(selectedId)) || filteredJobs[0] || null;
  }, [filteredJobs, selectedId]);

  const selectedJobId = selectedJob?.id ? String(selectedJob.id) : "";
  const selectedRecruiterId = selectedJob?.recruiter_id || selectedJob?.recruiterId || "";
  const canApplyToJob = Boolean(selectedJobId);
  const hasApplied = selectedJobId ? appliedJobIds.includes(selectedJobId) : false;
  const hasTask = Boolean(selectedJob?.has_project_assignment || selectedJob?.hasProjectAssignment);
  const taskDescription = String(selectedJob?.project_description || selectedJob?.projectDescription || "").trim();

  function onTaskDraftChange(value) {
    if (!selectedJobId) return;
    setTaskLinkDrafts((prev) => ({ ...prev, [selectedJobId]: value }));
  }

  function onTaskSubmit() {
    if (!selectedJobId) return;
    const value = String(taskLinkDrafts[selectedJobId] || "").trim();
    if (!value) {
      setTaskStatuses((prev) => ({ ...prev, [selectedJobId]: "Please add a task link." }));
      return;
    }
    setTaskLinks((prev) => ({ ...prev, [selectedJobId]: value }));
    setTaskStatuses((prev) => ({ ...prev, [selectedJobId]: "Task link submitted." }));
  }

  useEffect(() => {
    if (!applyOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setApplyOpen(false);
        setResumeFile(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyOpen]);

  useEffect(() => {
    if (!buildOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setBuildOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [buildOpen]);

  if (loadingUser) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "jobseeker") return <Navigate to="/" replace />;

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : "";
  const displayName = firstName || user?.fullName || user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-700">AI Recruiter</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Welcome, <span className="text-emerald-600">{displayName}</span></span>
            <button
              onClick={() => {
                (async () => {
                  await logout();
                  nav("/signin", { replace: true });
                })();
              }}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 mb-2">Explore Opportunities</h2>
          <p className="text-xl text-gray-600">Browse job openings and apply with your resume</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600" size={20} />
            <input
              type="text"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              placeholder="Search jobs by role (e.g., Frontend Developer, Data Scientist)..."
              className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-emerald-200 bg-white text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Job List */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Available Positions ({filteredJobs.length})</h3>
              {loadingJobs ? (
                <div className="p-8 text-center text-gray-500">Loading jobs...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No jobs found</div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedId(String(job.id))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        String(job.id) === selectedId
                          ? "border-emerald-600 bg-emerald-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <h4 className="font-bold text-gray-900">{job.title || job.role_title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.company_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <MapPin size={14} /> {job.location || "Remote"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Job Details */}
          <div className="lg:col-span-2">
            <JobDetailPanel
              selectedJob={selectedJob}
              hasApplied={hasApplied}
              hasTask={hasTask}
              taskDescription={taskDescription}
              taskLinkDrafts={taskLinkDrafts}
              taskLinks={taskLinks}
              taskStatuses={taskStatuses}
              selectedJobId={selectedJobId}
              selectedRecruiterId={selectedRecruiterId}
              onTaskDraftChange={onTaskDraftChange}
              onTaskSubmit={onTaskSubmit}
              onApplyClick={() => {
                if (!canApplyToJob) return;
                setApplyOpen(true);
                setResumeFile(null);
                setUploadError("");
                setUploadUrl("");
              }}
            />
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        open={applyOpen}
        selectedJob={selectedJob}
        resumeFile={resumeFile}
        uploadBusy={uploadBusy}
        uploadError={uploadError}
        uploadUrl={uploadUrl}
        onClose={() => {
          setApplyOpen(false);
          setResumeFile(null);
        }}
        onResume={setResumeFile}
        onUpload={handleUploadResume}
        onBuildClick={() => {
          setApplyOpen(false);
          setBuildOpen(true);
          setBuildError("");
          setBuildUrl("");
        }}
      />

      {/* Resume Builder Modal */}
      <ResumeBuilderModal
        open={buildOpen}
        buildBusy={buildBusy}
        buildError={buildError}
        buildUrl={buildUrl}
        resumeDraft={resumeDraft}
        onClose={() => setBuildOpen(false)}
        onBuild={handleBuildResume}
        onFieldChange={(field, value) =>
          setResumeDraft((s) => ({ ...s, [field]: value }))
        }
        onListFieldUpdate={updateListField}
        onListFieldAdd={addListField}
        onListFieldRemove={removeListField}
      />
    </div>
  );
}
