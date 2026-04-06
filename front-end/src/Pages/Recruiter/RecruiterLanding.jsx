import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  createRecruiterJobOpening,
  getCurrentUser,
  listRecruiterJobOpenings,
} from "../../Services/database";
import { Plus } from "lucide-react";
import RecruiterNavbar from "../../Components/RecruiterNavbar";
import CreateJobModal from "../../Components/CreateJobModal";
import JobCard from "../../Components/JobCard";

export default function RecruiterLanding() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form state
  const [formState, setFormState] = useState({
    roleTitle: "",
    compensation: "",
    description: "",
    skillsNeeded: "",
    jobType: "Full-time",
    jobLocation: "",
    applicationDeadline: "",
    screeningStartDate: "",
    screeningEndDate: "",
    hasProjectAssignment: false,
    projectDescription: "",
    yearsOfExperience: 0,
    headcount: 1,
  });

  // Mock candidates data
  const mockCandidates = {
    1: [
      {
        id: 1,
        name: "Aarav Sharma",
        status: "shortlisted",
        resume_score: 92,
        repo_score: 88,
        interview_score: 85,
        email: "aarav@example.com",
        phone: "+91-9876543210",
        skills: "React, Node.js, MongoDB",
        experience: 3,
        task_status: "completed",
        task_link: "https://github.com/aarav/task",
      },
      {
        id: 2,
        name: "Priya Patel",
        status: "shortlisted",
        resume_score: 85,
        repo_score: 90,
        interview_score: null,
        email: "priya@example.com",
        phone: "+91-9876543211",
        skills: "Vue.js, Python, PostgreSQL",
        experience: 2,
        task_status: "pending",
        task_link: null,
      },
    ],
  };

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
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "recruiter") return <Navigate to="/" replace />;

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : "";
  const displayName = firstName || user?.fullName || user?.email;

  function resetForm() {
    setFormState({
      roleTitle: "",
      compensation: "",
      description: "",
      skillsNeeded: "",
      jobType: "Full-time",
      jobLocation: "",
      applicationDeadline: "",
      screeningStartDate: "",
      screeningEndDate: "",
      hasProjectAssignment: false,
      projectDescription: "",
      yearsOfExperience: 0,
      headcount: 1,
    });
  }

  async function onCreateJob(e) {
    e?.preventDefault?.();
    setError("");

    if (formState.jobType !== "Remote" && !formState.jobLocation.trim()) {
      setError("Job location is required for non-remote positions.");
      return;
    }

    setBusy(true);
    try {
      await createRecruiterJobOpening({
        roleTitle: formState.roleTitle,
        compensation: formState.compensation,
        description: formState.description,
        skillsNeeded: formState.skillsNeeded,
        jobType: formState.jobType,
        jobLocation: formState.jobType === "Remote" ? "Remote" : formState.jobLocation,
        applicationDeadline: formState.applicationDeadline,
        screeningStartDate: formState.screeningStartDate,
        screeningEndDate: formState.screeningEndDate,
        hasProjectAssignment: formState.hasProjectAssignment,
        projectDescription: formState.projectDescription,
        yearsOfExperience: formState.yearsOfExperience,
        headcount: formState.headcount,
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

  const candidates = mockCandidates[expandedJob] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      <RecruiterNavbar displayName={displayName} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">Job Openings</h2>
            <p className="text-xl text-gray-600">Manage your posted positions and view candidates</p>
          </div>
          <button
            onClick={() => {
              setOpenModal(true);
              setError("");
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <Plus size={20} /> Add Job Opening
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {loadingJobs ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading job openings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-emerald-100">
            <p className="text-gray-500 text-lg mb-4">No job openings yet</p>
            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              <Plus size={20} /> Create Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                candidates={candidates}
                expanded={expandedJob === job.id}
                onToggle={() => {
                  setExpandedJob(expandedJob === job.id ? null : job.id);
                  setSelectedCandidate(null);
                }}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={setSelectedCandidate}
              />
            ))}
          </div>
        )}
      </div>

      <CreateJobModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          resetForm();
        }}
        busy={busy}
        onSubmit={onCreateJob}
        formState={formState}
        setFormState={setFormState}
      />
    </div>
  );
}
