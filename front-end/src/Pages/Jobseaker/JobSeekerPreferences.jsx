import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  getJobSeekerPreferences,
  saveJobSeekerPreferences,
} from "../../Services/database";

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
    return () => {
      mounted = false;
    };
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

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loadingUser || loadingPrefs) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "jobseeker") return <Navigate to="/" replace />;
  if (existingPrefs) return <Navigate to="/jobseeker" replace />;

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : "";
  const displayName = firstName || user?.fullName || user?.email;

  const totalSteps = 4;
  const progressLabel = `${step + 1} / ${totalSteps}`;

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
    setError("");
    setBusy(true);

    try {
      await saveJobSeekerPreferences(user.id, {
        jobRole,
        jobLocation,
        employmentType,
        minBasePay,
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

  return (
    <div className="min-h-screen flex items-stretch justify-center p-6 max-[420px]:p-3.5">
      <div className="w-full max-w-[520px] border border-white/10 bg-white/5 rounded-2xl p-[22px] max-[520px]:p-4 text-left">
        <div className="flex justify-between items-start gap-4 max-[520px]:flex-col max-[520px]:items-stretch">
          <div>
            <h1 className="text-xl m-0 font-semibold">Job Preferences</h1>
            <p className="mt-1.5 mb-0 text-sm opacity-80">Hi {displayName}, answer a few quick questions.</p>
          </div>
          <div className="w-[160px] flex-none max-[520px]:w-full" aria-label="Progress">
            <div className="text-xs opacity-85 text-right max-[520px]:text-left">{progressLabel}</div>
            <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
              <div className="h-full bg-indigo-500/50" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
            </div>
          </div>
        </div>

        {error ? <div className="mt-3.5 rounded-xl p-2.5 px-3 bg-red-600/20 border border-red-600/35" role="alert">{error}</div> : null}

        <form onSubmit={onFormSubmit} className="mt-[18px] grid gap-3.5">
          {step === 0 ? (
            <div className="grid gap-2.5">
              <div className="text-lg font-semibold">What job role are you looking for?</div>
              <label className="grid gap-1.5 min-w-0">
                <span className="text-[13px] opacity-90">Preferred job role</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  type="text"
                  placeholder="e.g., Frontend Developer"
                  autoFocus
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-2.5">
              <div className="text-lg font-semibold">Where do you want to work?</div>
              <label className="grid gap-1.5 min-w-0">
                <span className="text-[13px] opacity-90">Preferred location</span>
                <input
                  className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  type="text"
                  placeholder="e.g., Bengaluru / Remote"
                  autoFocus
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-2.5">
              <div className="text-lg font-semibold">What type of employment do you prefer?</div>
              <label className="grid gap-1.5 min-w-0">
                <span className="text-[13px] opacity-90">Employment type</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer text-center text-inherit ${employmentType === "fulltime" ? "border-indigo-500/70 bg-indigo-500/10" : ""}`}
                    onClick={() => setEmploymentType("fulltime")}
                  >
                    Full-time
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer text-center text-inherit ${employmentType === "parttime" ? "border-indigo-500/70 bg-indigo-500/10" : ""}`}
                    onClick={() => setEmploymentType("parttime")}
                  >
                    Part-time
                  </button>
                </div>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-2.5">
              <div className="text-lg font-semibold">What minimum base pay do you want?</div>
              <label className="grid gap-1.5 min-w-0">
                <span className="text-[13px] opacity-90">Minimum base pay (INR)</span>
                <div className="flex items-stretch gap-2">
                  <div className="flex items-center justify-center rounded-xl px-3 border border-white/15 bg-black/20 min-w-[44px]" aria-hidden="true">₹</div>
                  <input
                    className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
                    value={minBasePay}
                    onChange={(e) => setMinBasePay(e.target.value)}
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    placeholder="e.g., 500000"
                    autoFocus
                  />
                </div>
                <div className="mt-1.5 text-xs opacity-75">You can change this later in future versions.</div>
              </label>
            </div>
          ) : null}

          <div className="flex justify-between gap-3 mt-1 max-[520px]:flex-col">
            <button type="button" className="rounded-xl px-3 py-2.5 border border-white/10 bg-white/5 text-inherit cursor-pointer disabled:opacity-50" onClick={onBack} disabled={busy || step === 0}>
              Back
            </button>

            {step < totalSteps - 1 ? (
              <button type="button" className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer disabled:opacity-50" onClick={onNext} disabled={busy}>
                Next
              </button>
            ) : (
              <button type="submit" className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer disabled:opacity-50" disabled={busy}>
                {busy ? "Saving…" : "Finish"}
              </button>
            )}
          </div>

          <p className="m-0 opacity-75 text-[13px]">This is asked only once.</p>
        </form>
      </div>
    </div>
  );
}
