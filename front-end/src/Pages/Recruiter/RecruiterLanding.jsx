import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  listRecruiterJobOpenings,
  createRecruiterJobOpening,
  getCandidatesForJob,
  getRecruiterProfile,
  sendCandidateOfferEmail,
  sendCandidateRejectionEmail,
  updateCandidateSelectedStatus,
} from "../../Services/database";
import CandidateReportModal from "../../Components/CandidateReport";
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
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");

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

  // Load user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUser();
        if (mounted) setUser(u);
      } catch (err) {
        console.error("Error loading user:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load company name
  useEffect(() => {
    if (user?.id) {
      getRecruiterProfile(user.id)
        .then(profile => setCompanyName(profile?.company_name || "Our Company"))
        .catch(() => setCompanyName("Our Company"));
    }
  }, [user?.id]);

  // Load jobs
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

  const handleJobExpand = async (jobId) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      setCandidates([]);
      return;
    }

    setExpandedJob(jobId);
    setCandidateLoading(true);
    try {
      const cands = await getCandidatesForJob(jobId);
      setCandidates(cands);
    } catch (err) {
      setError(err?.message || "Could not load candidates");
      setCandidates([]);
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleSelectCandidate = async (candidate) => {
    try {
      const jobTitle = jobs.find(j => j.id === expandedJob)?.role_title || "Position";
      
      // Step 1: Update database
      await updateCandidateSelectedStatus(candidate.application_id, true);
      await sendCandidateOfferEmail(candidate.application_id, jobTitle, companyName);
      
      // Step 2: Fetch fresh data from database
      const updatedCandidates = await getCandidatesForJob(expandedJob);
      
      // Step 3: Find the updated candidate from database
      const updatedCandidate = updatedCandidates.find(
        c => c.application_id === candidate.application_id
      );
      
      // Step 4: Update modal with database value
      setSelectedCandidate(updatedCandidate || { ...candidate, selected: true });
      
      // Step 5: Update candidates list
      setCandidates(updatedCandidates);
      
      // Step 6: Close modal after showing success message
      setTimeout(() => {
        setShowCandidateModal(false);
        setSelectedCandidate(null);
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to process selection");
      throw err;
    }
  };

  const handleRejectCandidate = async (candidate) => {
    try {
      const jobTitle = jobs.find(j => j.id === expandedJob)?.role_title || "Position";
      
      // Step 1: Update database
      await updateCandidateSelectedStatus(candidate.application_id, false);
      await sendCandidateRejectionEmail(candidate.application_id, jobTitle, companyName);
      
      // Step 2: Fetch fresh data from database
      const updatedCandidates = await getCandidatesForJob(expandedJob);
      
      // Step 3: Find the updated candidate from database
      const updatedCandidate = updatedCandidates.find(
        c => c.application_id === candidate.application_id
      );
      
      // Step 4: Update modal with database value
      setSelectedCandidate(updatedCandidate || { ...candidate, selected: false });
      
      // Step 5: Update candidates list
      setCandidates(updatedCandidates);
      
      // Step 6: Close modal after showing success message
      setTimeout(() => {
        setShowCandidateModal(false);
        setSelectedCandidate(null);
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to process rejection");
      throw err;
    }
  };

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
                onToggle={() => handleJobExpand(job.id)}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={(cand) => {
                  setSelectedCandidate(cand);
                  setShowCandidateModal(true);
                }}
                loadingCandidates={candidateLoading}
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

      <CandidateReportModal
        candidate={selectedCandidate}
        open={showCandidateModal}
        onClose={() => {
          setShowCandidateModal(false);
          setSelectedCandidate(null);
        }}
        onSelect={handleSelectCandidate}
        onReject={handleRejectCandidate}
        jobTitle={jobs.find(j => j.id === expandedJob)?.role_title || "Position"}
        companyName={companyName}
        loading={candidateLoading}
      />
    </div>
  );
}
