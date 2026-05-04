import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getCurrentUser, getJobSeekerPreferences, saveJobSeekerPreferences } from "../../Services/database";
import { ArrowRight, ChevronRight, Briefcase, MapPin, Clock, DollarSign, Zap } from "lucide-react";

export default function JobSeekerPreferences() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [existingPrefs, setExistingPrefs] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [jobRole, setJobRole] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("fulltime");
  const [minBasePay, setMinBasePay] = useState("");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    let mounted = true;
    (async () => {
      if (!user?.id) {
        if (mounted) {
          setExistingPrefs(null);
          setLoadingPrefs(false);
        }
        return;
      }

      try {
        setLoadingPrefs(true);
        const prefs = await getJobSeekerPreferences(user.id);
        if (mounted) setExistingPrefs(prefs);
      } catch (e) {
        if (mounted) setError(e?.message || "Could not load preferences.");
      } finally {
        if (mounted) setLoadingPrefs(false);
      }
    })();

    return () => { mounted = false; };
  }, [user?.id]);

  if (loadingUser || loadingPrefs) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "jobseeker") return <Navigate to="/" replace />;
  if (existingPrefs) return <Navigate to="/jobseeker" replace />;

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : "";
  const displayName = firstName || user?.fullName || user?.email;

  const totalSteps = 4;
  const progressLabel = `${step + 1} / ${totalSteps}`;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  function validateCurrentStep() {
    if (step === 0) {
      if (!String(jobRole).trim()) return "Job role is required.";
    }
    if (step === 1) {
      if (!String(jobLocation).trim()) return "Job location is required.";
    }
    if (step === 2) {
      if (employmentType !== "fulltime" && employmentType !== "parttime") {
        return "Employment type is required.";
      }
    }
    if (step === 3) {
      if (!String(minBasePay).trim()) return "Minimum base pay is required.";
      const value = Number(minBasePay);
      if (!Number.isFinite(value) || value < 0) return "Minimum base pay must be 0 or more.";
    }
    return "";
  }

  function onNext() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function onBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    // Validate all steps before submitting
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    
    setError("");
    setBusy(true);

    try {
      await saveJobSeekerPreferences(user.id, {
        jobRole,
        jobLocation,
        employmentType,
        minBasePay: Number(minBasePay),
      });
      nav("/jobseeker", { replace: true });
    } catch (err) {
      setError(err?.message || "Could not save preferences.");
    } finally {
      setBusy(false);
    }
  }

  async function onFormSubmit(e) {
    e.preventDefault();
    if (busy) return;

    if (step < totalSteps - 1) {
      onNext();
      return;
    }

    await onSubmit(e);
  }

  const steps = [
    {
      title: "What job role are you looking for?",
      icon: Briefcase,
      placeholder: "e.g., Frontend Developer",
      field: "role",
    },
    {
      title: "Where do you want to work?",
      icon: MapPin,
      placeholder: "e.g., Bengaluru / Remote",
      field: "location",
    },
    {
      title: "What type of employment do you prefer?",
      icon: Clock,
      field: "employment",
    },
    {
      title: "What minimum base pay do you want?",
      icon: DollarSign,
      placeholder: "e.g., 500000",
      field: "salary",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 flex items-center justify-center p-6 py-12">
      {/* Background Gradient Orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Let's Get You Started!</h1>
          <p className="text-xl text-gray-600">Tell us about your job preferences so we can find the perfect matches</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-emerald-100">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Step {step + 1} of {totalSteps}</h2>
              <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onFormSubmit} className="space-y-6">
            {/* Step Title with Icon */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl">
                <Icon size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{currentStep.title}</h3>
            </div>

            {/* Step 0: Job Role */}
            {step === 0 && (
              <div className="space-y-3 animate-fadeIn">
                <input
                  className="w-full px-6 py-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-lg placeholder-gray-400"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  type="text"
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
                <p className="text-sm text-gray-500">Examples: Frontend Developer, Data Scientist, Product Manager</p>
              </div>
            )}

            {/* Step 1: Job Location */}
            {step === 1 && (
              <div className="space-y-3 animate-fadeIn">
                <input
                  className="w-full px-6 py-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-lg placeholder-gray-400"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  type="text"
                  placeholder={currentStep.placeholder}
                  autoFocus
                />
                <p className="text-sm text-gray-500">Examples: Bengaluru, New York, Remote, Hybrid</p>
              </div>
            )}

            {/* Step 2: Employment Type */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      employmentType === "fulltime"
                        ? "border-emerald-600 bg-emerald-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-emerald-200"
                    }`}
                  >
                    <input
                      type="radio"
                      value="fulltime"
                      checked={employmentType === "fulltime"}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Clock size={32} className={`mx-auto mb-2 ${employmentType === "fulltime" ? "text-emerald-600" : "text-gray-600"}`} />
                      <p className="font-bold text-gray-900">Full-time</p>
                      <p className="text-sm text-gray-600 mt-1">Standard 40 hours/week</p>
                    </div>
                  </label>
                  <label
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      employmentType === "parttime"
                        ? "border-emerald-600 bg-emerald-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-emerald-200"
                    }`}
                  >
                    <input
                      type="radio"
                      value="parttime"
                      checked={employmentType === "parttime"}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Clock size={32} className={`mx-auto mb-2 ${employmentType === "parttime" ? "text-emerald-600" : "text-gray-600"}`} />
                      <p className="font-bold text-gray-900">Part-time</p>
                      <p className="text-sm text-gray-600 mt-1">Flexible hours</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Salary */}
            {step === 3 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-stretch gap-3">
                  <div className="flex items-center justify-center rounded-xl px-4 border-2 border-emerald-100 bg-emerald-50">
                    <span className="text-2xl font-bold text-emerald-600">₹</span>
                  </div>
                  <input
                    className="flex-1 px-6 py-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-lg placeholder-gray-400"
                    value={minBasePay}
                    onChange={(e) => setMinBasePay(e.target.value)}
                    type="number"
                    min={0}
                    step="10000"
                    inputMode="numeric"
                    placeholder="500000"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500">This is your minimum expectation. You can adjust later.</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-emerald-100">
              <button
                type="button"
                onClick={onBack}
                disabled={busy || step === 0}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-emerald-300 hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={busy}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-6 rounded-xl font-bold transition transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  Next <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-6 rounded-xl font-bold transition transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Finish <ArrowRight size={20} />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 pt-4">You can always update your preferences later</p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Step {step + 1} of {totalSteps}</p>
        </div>
      </div>
    </div>
  );
}
