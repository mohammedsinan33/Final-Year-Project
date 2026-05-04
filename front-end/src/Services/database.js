import { supabase, requireSupabase } from "../lib/supabaseClient";

// Custom auth via Supabase Postgres RPC (no confirmation emails).
// You must create the SQL tables + functions in Supabase:
// - public.app_users (stores bcrypt hash)
// - public.app_sessions (stores session token)
// - public.jobseeker_preferences (prefs keyed by user_id)
// - RPC functions: app_register, app_login, app_get_user, app_logout,
//                  app_prefs_get, app_prefs_upsert

const SESSION_KEY = "app_session_token";

const listeners = new Set();
function notify(user) {
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch {
      // ignore
    }
  });
}

export function getSessionToken() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setSessionToken(token) {
  try {
    if (!token) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, token);
  } catch {
    // ignore
  }
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  };
}

export async function getCurrentUser() {
  const token = getSessionToken();
  if (!token) return null;

  const { data, error } = await supabase.rpc("app_get_user", {
    p_token: token,
  });
  if (error) {
    setSessionToken(null);
    return null;
  }

  return mapUser(data);
}

export function onAuthStateChange(callback) {
  listeners.add(callback);

  // Cross-tab sync
  function onStorage(e) {
    if (e.key !== SESSION_KEY) return;
    (async () => {
      const user = await getCurrentUser();
      callback(user);
    })();
  }

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export async function login({ email, password }) {
  const { data, error } = await supabase.rpc("app_login", {
    p_email: String(email || "").trim().toLowerCase(),
    p_password: String(password || ""),
  });

  if (error) throw error;
  if (!data?.session_token || !data?.user) throw new Error("Login failed.");

  setSessionToken(data.session_token);
  const user = mapUser(data.user);
  notify(user);
  return user;
}

export async function register({ email, password, role, fullName }) {
  const normalizedFullName = String(fullName || "").trim();
  if (!normalizedFullName) throw new Error("Full name is required.");
  if (role !== "recruiter" && role !== "jobseeker")
    throw new Error("Please select an account type.");

  const { data, error } = await supabase.rpc("app_register", {
    p_email: String(email || "").trim().toLowerCase(),
    p_password: String(password || ""),
    p_full_name: normalizedFullName,
    p_role: role,
  });

  if (error) throw error;
  if (!data?.session_token || !data?.user) throw new Error("Registration failed.");

  setSessionToken(data.session_token);
  const user = mapUser(data.user);
  notify(user);
  return user;
}

export async function logout() {
  const token = getSessionToken();
  setSessionToken(null);

  const supabase = requireSupabase();
  if (token) {
    await supabase.rpc("app_logout", { p_token: token });
  }

  notify(null);
}

// --- Job seeker preferences via token RPC

export async function getJobSeekerPreferences(userId) {
  // userId is unused in custom auth mode; kept for compatibility with the UI.
  const token = getSessionToken();
  if (!token) return null;

  const { data, error } = await supabase.rpc("app_prefs_get", {
    p_token: token,
  });
  if (error) throw error;
  return data;
}

export async function hasJobSeekerPreferences(userId) {
  const prefs = await getJobSeekerPreferences(userId);
  return Boolean(prefs);
}

export async function saveJobSeekerPreferences(userId, prefs) {
  const token = getSessionToken();
  if (!token) throw new Error("User not found.");

  const jobRole = String(prefs?.jobRole || "").trim();
  const jobLocation = String(prefs?.jobLocation || "").trim();
  const employmentType = String(prefs?.employmentType || "").trim();
  const minBasePay = Number(prefs?.minBasePay);

  if (!jobRole) throw new Error("Job role is required.");
  if (!jobLocation) throw new Error("Job location is required.");
  if (employmentType !== "fulltime" && employmentType !== "parttime") {
    throw new Error("Employment type is required.");
  }
  if (!Number.isFinite(minBasePay) || minBasePay < 0)
    throw new Error("Minimum base pay must be 0 or more.");

  const { data, error } = await supabase.rpc("app_prefs_upsert", {
    p_token: token,
    p_job_role: jobRole,
    p_job_location: jobLocation,
    p_employment_type: employmentType,
    p_min_base_pay: minBasePay,
  });
  if (error) throw error;
  return data;
}

// --- Recruiter company profile (one-time) via token RPC

export async function getRecruiterProfile(userId) {
  try {
    const supabase = requireSupabase();
    
    const { data, error } = await supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.log("No recruiter profile found");
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching recruiter profile:", error);
    return null;
  }
}

export async function hasRecruiterProfile(userId) {
  const profile = await getRecruiterProfile(userId);
  return Boolean(profile);
}

export async function saveRecruiterProfile(userId, profile) {
  const token = getSessionToken();
  if (!token) throw new Error("User not found.");

  const companyName = String(profile?.companyName || "").trim();
  const companyDomain = String(profile?.companyDomain || "").trim();
  const industry = String(profile?.industry || "").trim();
  const companySize = String(profile?.companySize || "").trim();
  const headquarters = String(profile?.headquarters || "").trim();

  if (!companyName) throw new Error("Company name is required.");
  if (!companyDomain) throw new Error("Company domain is required.");

  const { data, error } = await supabase.rpc("app_recruiter_profile_upsert", {
    p_token: token,
    p_company_name: companyName,
    p_company_domain: companyDomain,
    p_industry: industry,
    p_company_size: companySize,
    p_headquarters: headquarters,
  });
  if (error) throw error;
  return data;
}

// --- Recruiter job openings via token RPC

export async function listRecruiterJobOpenings() {
  const token = getSessionToken();
  if (!token) return [];

  const { data, error } = await supabase.rpc("app_job_openings_list", {
    p_token: token,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createRecruiterJobOpening(payload) {
  const token = getSessionToken();
  if (!token) throw new Error("User not found.");

  const roleTitle = String(payload?.roleTitle || "").trim();
  const compensation = String(payload?.compensation || "").trim();
  const description = String(payload?.description || "").trim();
  const skillsNeeded = String(payload?.skillsNeeded || "").trim();
  const jobType = String(payload?.jobType || "Full-time").trim();
  const jobLocation = String(payload?.jobLocation || "Remote").trim();
  const applicationDeadline = toIsoOrNull(payload?.applicationDeadline);
  const screeningStartDate = toIsoOrNull(payload?.screeningStartDate);
  const screeningEndDate = toIsoOrNull(payload?.screeningEndDate);
  const hasProjectAssignment = Boolean(payload?.hasProjectAssignment);
  const projectDescription = String(payload?.projectDescription || "").trim();
  const yearsOfExperience = Number(payload?.yearsOfExperience);
  const headcount = Number(payload?.headcount);

  if (!roleTitle) throw new Error("Role title is required.");
  if (!description) throw new Error("Job description is required.");
  if (!jobType) throw new Error("Job type is required.");
  if (jobType !== "Remote" && !jobLocation)
    throw new Error("Job location is required for non-remote positions.");
  if (!Number.isFinite(yearsOfExperience) || yearsOfExperience < 0) {
    throw new Error("Years of experience must be 0 or more.");
  }
  if (!Number.isFinite(headcount) || headcount <= 0) {
    throw new Error("Hiring count must be 1 or more.");
  }
  if (hasProjectAssignment && !projectDescription) {
    throw new Error("Project description is required.");
  }

  const { data, error } = await supabase.rpc("app_job_opening_create", {
    p_token: token,
    p_role_title: roleTitle,
    p_compensation: compensation,
    p_description: description,
    p_skills_needed: skillsNeeded,
    p_job_type: jobType,
    p_job_location: jobLocation,
    p_application_deadline: applicationDeadline || null,
    p_screening_start_date: screeningStartDate || null,
    p_screening_end_date: screeningEndDate || null,
    p_has_project_assignment: hasProjectAssignment,
    p_project_description: hasProjectAssignment ? projectDescription : null,
    p_years_of_experience: yearsOfExperience,
    p_headcount: headcount,
  });
  if (error) throw error;
  return data;
}

// --- Public job openings list (for job seekers)

export async function listPublicJobOpenings() {
  const supabase = requireSupabase();

  // Fetch jobs with recruiter profile details
  const { data: jobs, error: jobsError } = await supabase
    .from("recruiter_job_openings")
    .select("*")
    .order("created_at", { ascending: false });

  if (jobsError || !Array.isArray(jobs) || jobs.length === 0) {
    const { data, error } = await supabase.rpc("app_public_job_openings_list");
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  // Get unique recruiter IDs
  const recruiterIds = [...new Set(jobs.map(j => j.recruiter_id).filter(Boolean))];
  
  if (recruiterIds.length === 0) return jobs;

  // Fetch recruiter profile details (company info)
  const { data: profiles, error: profilesError } = await supabase
    .from("recruiter_profiles")
    .select("user_id, company_name")
    .in("user_id", recruiterIds);

  if (profilesError || !profiles) {
    return jobs;
  }

  // Create a map for quick lookup
  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.user_id] = p;
  });

  // Merge profile data with jobs and filter out expired deadlines
  const now = new Date();
  return jobs
    .filter(job => {
      // If no deadline is set, keep the job
      if (!job.application_deadline) return true;
      
      // If deadline exists, check if it's in the future
      const deadline = new Date(job.application_deadline);
      return deadline > now;
    })
    .map(job => ({
      ...job,
      company_name: profileMap[job.recruiter_id]?.company_name || "Company",
      industry: profileMap[job.recruiter_id]?.industry || "",
      company_size: profileMap[job.recruiter_id]?.company_size || "",
      headquarters: profileMap[job.recruiter_id]?.headquarters || "",
      date_posted: new Date(job.created_at).toLocaleDateString(),
    }));
}

// --- Job applications (via RPC for custom auth)

export async function createJobApplication({ candidateId, recruiterId, jobId, resumeUrl }) {
  const token = getSessionToken();
  if (!token) throw new Error("User not authenticated.");

  const jobIdStr = String(jobId || "").trim();
  const recruiterIdStr = String(recruiterId || "").trim();
  const resumeStr = String(resumeUrl || "").trim();

  if (!jobIdStr) throw new Error("Job ID is required.");
  if (!recruiterIdStr) throw new Error("Recruiter ID is required.");
  if (!resumeStr) throw new Error("Resume URL is required.");

  const { data, error } = await supabase.rpc("app_create_job_application", {
    p_token: token,
    p_job_id: jobIdStr,
    p_recruiter_id: recruiterIdStr,
    p_resume_url: resumeStr,
  });

  if (error) throw error;
  return data;
}

// --- Resume upload to Supabase Storage

export async function uploadResume(file) {
  if (!file) throw new Error("No file selected");

  const supabase = requireSupabase();
  const token = getSessionToken();
  if (!token) throw new Error("User not authenticated");

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filename = `resume_${timestamp}_${randomStr}.pdf`;

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("Resume_Storage")
      .upload(`uploaded/${filename}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get PUBLIC URL (not signed) for long-term storage
    const bucketUrl = "https://utuzyoyjmwmrktnvjkfe.supabase.co";
    const resume_url = `${bucketUrl}/storage/v1/object/public/Resume_Storage/uploaded/${filename}`;

    return {
      resume_url: resume_url,
      filename: filename,
    };
  } catch (err) {
    throw new Error(`Failed to upload resume: ${err.message}`);
  }
}

export async function uploadResumeAndAnalyze({ 
  file, 
  jobId, 
  recruiterId, 
  candidateId 
}) {
  if (!file) throw new Error("No file selected");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_id", jobId);
  formData.append("recruiter_id", recruiterId);
  formData.append("candidate_id", candidateId);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const res = await fetch(
    `${API_BASE_URL}/applications/analyze-and-save-application`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to analyze resume");
  }

  return res.json();
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function triggerDueScreeningProcessing() {
  const res = await fetch(`${API_BASE_URL}/applications/process-due-screenings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to process due screenings");
  }
  return res.json();
}

function toIsoOrNull(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

    // Send resume directly to backend for analysis
    const result = await uploadResumeAndAnalyze({
      file: resumeFile,
      jobId,
      recruiterId,
      candidateId,
    });

    console.log("Resume analyzed and saved:", result);
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

// Interview Scheduler functions
export const fetchJobDetails = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from("recruiter_job_openings")
      .select("role_title, screening_start_date, screening_end_date, project_description")
      .eq("id", jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching job details:", error);
    throw error;
  }
};

export const scheduleInterview = async (appId, scheduledDateTime) => {
  try {
    const { error } = await supabase
      .from("job_applications")
      .update({
        interview_scheduled_date: scheduledDateTime,
        interview_status: "scheduled",
      })
      .eq("id", appId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error scheduling interview:", error);
    throw error;
  }
};

export const sendInterviewConfirmationEmail = async (appId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/send-interview-confirmation-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ app_id: appId }),
      }
    );

    if (!response.ok) throw new Error("Failed to send confirmation email");
    return await response.json();
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
};

export const submitProjectDetails = async (appId, projectData) => {
  if (!appId) throw new Error("Missing application id.");

  const repositoryLink = String(projectData?.repositoryLink || "").trim();
  const hostedLink = String(projectData?.hostedLink || "").trim();
  const description = String(projectData?.description || "").trim();

  if (!repositoryLink) throw new Error("Repository link is required.");
  if (!hostedLink) throw new Error("Hosted link is required.");
  if (!description) throw new Error("Project description is required.");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const response = await fetch(`${API_BASE_URL}/applications/submit-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      project_repository_link: repositoryLink,
      project_hosted_link: hostedLink,
      project_description: description,
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || "Failed to submit project details");
  }

  return true;
};

// Get candidates for a specific job
export async function getCandidatesForJob(jobId) {
  try {
    const supabase = requireSupabase();
    
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        candidate_id,
        selected,
        match_score,
        match_summary,
        project_alignment_score,
        project_alignment_summary,

        interview_rating,
        interview_status,
        interview_feedback,
        overall_score,
        technical_score,
        communication_score,
        integrity_score,
        experience_match,
        skills_match,
        job_match_score,
        eligibility_status,
        eligibility_reasoning,
        required_skills,
        demonstrated_skills,
        skill_gaps,
        audio_analysis,
        proctoring_violations,
        key_skills,
        experience,
        education,
        highlights,
        description,
        resume_report_status
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch user details separately for each candidate
    const enrichedData = await Promise.all(
      (data || []).map(async (app) => {
        try {
          const { data: user } = await supabase
            .from("app_users")
            .select("id, email, full_name")
            .eq("id", app.candidate_id)
            .single();

          return {
            id: app.id,
            candidate_id: app.candidate_id,
            application_id: app.id,
            name: user?.full_name || "Candidate",
            email: user?.email || "N/A",
            phone: "N/A",
            selected: app.selected,
            skills: Array.isArray(app.key_skills) ? app.key_skills.join(", ") : (app.key_skills || "N/A"),
            experience: Array.isArray(app.experience) ? app.experience : [],
            education: Array.isArray(app.education) ? app.education : [],
            highlights: Array.isArray(app.highlights) ? app.highlights : [],
            description: app.description || "N/A",
            // Resume screening
            match_score: app.match_score,
            match_summary: app.match_summary,
            resume_report_status: app.resume_report_status,
            // Project submission
            project_alignment_score: app.project_alignment_score,
            project_alignment_summary: app.project_alignment_summary,

            // Interview
            interview_rating: app.interview_rating,
            interview_score: app.interview_rating, // for compatibility
            interview_status: app.interview_status,
            interview_feedback: app.interview_feedback,
            audio_analysis: app.audio_analysis,
            proctoring_violations: app.proctoring_violations,
            // Scores
            overall_score: app.overall_score,
            technical_score: app.technical_score,
            communication_score: app.communication_score,
            integrity_score: app.integrity_score,
            experience_match: app.experience_match,
            skills_match: app.skills_match,
            job_match_score: app.job_match_score,
            // Eligibility & Skills
            eligibility_status: app.eligibility_status,
            eligibility_reasoning: app.eligibility_reasoning,
            required_skills: Array.isArray(app.required_skills) ? app.required_skills : [],
            demonstrated_skills: Array.isArray(app.demonstrated_skills) ? app.demonstrated_skills : [],
            skill_gaps: Array.isArray(app.skill_gaps) ? app.skill_gaps : [],
          };
        } catch (err) {
          console.error(`Error fetching user ${app.candidate_id}:`, err);
          return {
            id: app.id,
            candidate_id: app.candidate_id,
            application_id: app.id,
            name: "Candidate",
            email: "N/A",
            phone: "N/A",
            selected: app.selected,
            skills: "N/A",
            experience: [],
            education: [],
            highlights: [],
            description: "N/A",
            match_score: app.match_score,
            match_summary: app.match_summary,
            resume_report_status: app.resume_report_status,
            project_alignment_score: app.project_alignment_score,
            project_alignment_summary: app.project_alignment_summary,
            interview_rating: app.interview_rating,
            interview_score: app.interview_rating,
            interview_status: app.interview_status,
            interview_feedback: app.interview_feedback,
            audio_analysis: app.audio_analysis,
            proctoring_violations: app.proctoring_violations,
            overall_score: app.overall_score,
            technical_score: app.technical_score,
            communication_score: app.communication_score,
            integrity_score: app.integrity_score,
            experience_match: app.experience_match,
            skills_match: app.skills_match,
            job_match_score: app.job_match_score,
            eligibility_status: app.eligibility_status,
            eligibility_reasoning: app.eligibility_reasoning,
            required_skills: [],
            demonstrated_skills: [],
            skill_gaps: [],
          };
        }
      })
    );

    return enrichedData;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
}

// Send offer/selection email via backend
export async function sendCandidateOfferEmail(applicationId, jobTitle, companyName) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(`${API_BASE_URL}/recruiter/send-offer-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: applicationId,
        job_title: jobTitle,
        company_name: companyName,
      }),
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || "Failed to send offer email");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending offer email:", error);
    throw error;
  }
}

// Send rejection email via backend
export async function sendCandidateRejectionEmail(applicationId, jobTitle, companyName) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(`${API_BASE_URL}/recruiter/send-rejection-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: applicationId,
        job_title: jobTitle,
        company_name: companyName,
      }),
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || "Failed to send rejection email");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending rejection email:", error);
    throw error;
  }
}

// Update candidate status
export async function updateCandidateStatus(applicationId, status) {
  try {
    const supabase = requireSupabase();
    
    const { error } = await supabase
      .from("job_applications")
      .update({ application_status: status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating candidate status:", error);
    throw error;
  }
}

// Update candidate selected status
export async function updateCandidateSelectedStatus(applicationId, selected) {
  try {
    const supabase = requireSupabase();
    
    const { error } = await supabase
      .from("job_applications")
      .update({ selected: selected })
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating selected status:", error);
    throw error;
  }
}

// Get candidate preferences from jobseeker_preferences table
export async function getCandidatePreferences(userId) {
  try {
    const supabase = requireSupabase();
    
    const { data, error } = await supabase
      .from("jobseeker_preferences")
      .select("job_location, employment_type, min_base_pay")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      job_location: "N/A",
      employment_type: "N/A",
      min_base_pay: 0
    };
  } catch (error) {
    console.error("Error fetching candidate preferences:", error);
    return {
      job_location: "N/A",
      employment_type: "N/A",
      min_base_pay: 0
    };
  }
}

// Get selected candidates with personal details and preferences for a job
export async function getSelectedCandidatesWithDetails(jobId) {
  try {
    const supabase = requireSupabase();
    
    // Step 1: Get only selected candidates for the job
    const { data: selectedApps, error: appsError } = await supabase
      .from("job_applications")
      .select(`
        id,
        candidate_id,
        selected,
        match_score,
        overall_score,
        technical_score,
        communication_score,
        integrity_score,
        eligibility_status
      `)
      .eq("job_id", jobId)
      .eq("selected", true)
      .order("overall_score", { ascending: false });

    if (appsError) throw appsError;

    if (!selectedApps || selectedApps.length === 0) {
      return [];
    }

    // Step 2: Enrich with personal details and preferences
    const enrichedData = await Promise.all(
      selectedApps.map(async (app) => {
        try {
          // Get personal details from app_users
          const { data: user } = await supabase
            .from("app_users")
            .select("id, email, full_name")
            .eq("id", app.candidate_id)
            .single();

          // Get job preferences
          const { data: preferences } = await supabase
            .from("jobseeker_preferences")
            .select("job_location, employment_type, min_base_pay")
            .eq("user_id", app.candidate_id)
            .single();

          return {
            // Application info
            id: app.id,
            candidate_id: app.candidate_id,
            application_id: app.id,
            selected: app.selected,
            
            // Personal details
            name: user?.full_name || "Candidate",
            email: user?.email || "N/A",
            
            // Scores
            match_score: app.match_score || 0,
            overall_score: app.overall_score || 0,
            technical_score: app.technical_score || 0,
            communication_score: app.communication_score || 0,
            integrity_score: app.integrity_score || 0,
            eligibility_status: app.eligibility_status || "N/A",
            
            // Job preferences
            preferred_location: preferences?.job_location || "N/A",
            employment_type: preferences?.employment_type || "N/A",
            min_base_pay: preferences?.min_base_pay || 0,
          };
        } catch (err) {
          console.error(`Error enriching candidate ${app.candidate_id}:`, err);
          
          // Return basic info even if enrichment fails
          return {
            id: app.id,
            candidate_id: app.candidate_id,
            application_id: app.id,
            selected: app.selected,
            name: "Candidate",
            email: "N/A",
            match_score: app.match_score || 0,
            overall_score: app.overall_score || 0,
            technical_score: app.technical_score || 0,
            communication_score: app.communication_score || 0,
            integrity_score: app.integrity_score || 0,
            eligibility_status: app.eligibility_status || "N/A",
            preferred_location: "N/A",
            employment_type: "N/A",
            min_base_pay: 0,
          };
        }
      })
    );

    return enrichedData;
  } catch (error) {
    console.error("Error fetching selected candidates with details:", error);
    throw error;
  }
}