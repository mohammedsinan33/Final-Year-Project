import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createJobApplication, getCurrentUser, listPublicJobOpenings, logout, uploadResume, triggerDueScreeningProcessing } from "../../Services/database";
import { requireSupabase } from "../../lib/supabaseClient";
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
      // ignore storage errors
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
      const result = await uploadResume(resumeFile);
      const resumeUrl = String(result.resume_url || "").trim();
      setUploadUrl(resumeUrl);

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
      if (!resumeUrl) throw new Error("Resume upload did not return a URL.");

      await createJobApplication({
        candidateId,
        recruiterId,
        jobId,
        resumeUrl,
      });

      try {
        // If you added process-one endpoint, use created.id here.
        await triggerDueScreeningProcessing();
      } catch (e) {
        console.warn("Resume processing trigger failed:", e?.message || e);
      }

      const jobIdStr = String(jobId);
      setAppliedJobIds((prev) => {
        const next = prev.includes(jobIdStr) ? prev : [...prev, jobIdStr];
        if (user?.id) persistAppliedJobs(user.id, next);
        return next;
      });
      setApplyOpen(false);
      setResumeFile(null);
    } catch (err) {
      setUploadError(err?.message || "Could not upload resume.");
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

      const result = await buildResume(payload);
      setBuildUrl(result.resume_url || "");
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
    return () => {
      mounted = false;
    };
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
    return () => {
      mounted = false;
    };
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
              // ignore: keep current list/fallback
            }
          }
        )
        .subscribe();
    } catch {
      // Supabase not configured or realtime not available.
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
    <div className="min-h-screen p-6 flex justify-center max-[980px]:p-3.5">
      <div className="w-full max-w-[1150px] grid grid-rows-[auto_1fr] gap-4">
        <JobHeader
          displayName={displayName}
          onLogout={() => {
            (async () => {
              await logout();
              nav("/signin", { replace: true });
            })();
          }}
        />

        <JobSearchBar roleQuery={roleQuery} setRoleQuery={setRoleQuery} />

        <div className="grid grid-cols-[1fr_1.25fr] gap-4 items-start max-[980px]:grid-cols-1">
          <JobListPanel
            filteredJobs={filteredJobs}
            selectedJobId={selectedJob?.id ? String(selectedJob.id) : ""}
            onSelect={setSelectedId}
          />

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
