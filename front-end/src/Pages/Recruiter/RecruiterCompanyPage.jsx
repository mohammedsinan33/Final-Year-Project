import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function RecruiterCompanyPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [headquarters, setHeadquarters] = useState("");


  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // Store company profile in localStorage or send to backend
      localStorage.setItem("recruiterProfile", JSON.stringify({
        companyName,
        companyDomain,
        industry,
        companySize,
        headquarters,
      }));
      nav("/recruiter", { replace: true });
    } catch (err) {
      setError(err?.message || "Could not save company profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch justify-center p-6 max-[420px]:p-3.5">
      <div className="w-full max-w-[520px] border border-white/10 bg-white/5 rounded-2xl p-[22px] text-left max-[420px]:p-4">
        <h1 className="m-0 text-xl font-semibold">Company Profile</h1>
        <p className="mt-1.5 mb-0 text-sm opacity-80">Tell us about your company (asked once).</p>

        {error ? (
          <div className="mt-2.5 p-2.5 px-3 rounded-xl border border-red-600/35 bg-red-600/10" role="alert">
            {error}
          </div>
        ) : null}

        <form className="mt-3 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1.5">
            <span className="text-[13px] opacity-85 font-semibold">Company name</span>
            <input
              className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              type="text"
              placeholder="e.g., Continental"
              required
              autoFocus
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] opacity-85 font-semibold">Company domain</span>
            <input
              className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              type="text"
              placeholder="e.g., continental.com"
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] opacity-85 font-semibold">Industry (optional)</span>
            <input
              className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              type="text"
              placeholder="e.g., Automotive / Software"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] opacity-85 font-semibold">Company size (optional)</span>
            <input
              className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              type="text"
              placeholder="e.g., 201–500"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] opacity-85 font-semibold">Headquarters (optional)</span>
            <input
              className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
              value={headquarters}
              onChange={(e) => setHeadquarters(e.target.value)}
              type="text"
              placeholder="e.g., Bengaluru"
            />
          </label>

          <div className="mt-1 flex justify-end">
            <button type="submit" className="rounded-xl px-3 py-2.5 border border-indigo-500/55 bg-indigo-500/15 text-inherit cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" disabled={busy}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
