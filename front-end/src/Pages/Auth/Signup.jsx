import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function Signup() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  function goAfterRegister(userRole) {
    if (userRole === "recruiter") {
      nav("/recruiter/company", { replace: true });
      return;
    }

    nav("/jobseeker/preferences", { replace: true });
  }

  async function onRegisterSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register(regEmail, regPassword, role, fullName);
      goAfterRegister(user.role);
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch justify-center p-6 max-[420px]:p-3.5">
      <div className="w-full max-w-[520px] flex items-stretch">
        <div className="w-full border border-white/10 bg-white/5 rounded-2xl p-[22px] text-left max-[420px]:p-4">
          <div className="mb-3.5">
            <h2 className="m-0 text-xl">Create your account</h2>
            <p className="mt-1.5 mb-0 text-sm opacity-80">Use your email and password.</p>
          </div>

          {error ? (
            <div className="rounded-xl p-2.5 bg-red-600/20 border border-red-500/40 mb-3" role="alert">
              {error}
            </div>
          ) : null}

          <form className="grid gap-3" onSubmit={onRegisterSubmit}>
            <label className="grid gap-1.5 min-w-0">
              <span className="text-[13px] opacity-90">Full name</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/20 bg-black/20 text-inherit outline-none focus:border-indigo-400/90 focus:ring-2 focus:ring-indigo-500/20"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                required
              />
            </label>

            <label className="grid gap-1.5 min-w-0">
              <span className="text-[13px] opacity-90">Account type</span>
              <select
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/20 bg-black text-inherit outline-none focus:border-indigo-400/90 focus:ring-2 focus:ring-indigo-500/20"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Account type"
              >
                <option value="jobseeker">Job seeker</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </label>

            <label className="grid gap-1.5 min-w-0">
              <span className="text-[13px] opacity-90">Email</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/20 bg-black/20 text-inherit outline-none focus:border-indigo-400/90 focus:ring-2 focus:ring-indigo-500/20"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="grid gap-1.5 min-w-0">
              <span className="text-[13px] opacity-90">Password</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/20 bg-black/20 text-inherit outline-none focus:border-indigo-400/90 focus:ring-2 focus:ring-indigo-500/20"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </label>

            <button
              className="mt-1 rounded-xl px-3 py-2.5 border border-indigo-400/60 bg-indigo-500/20 text-inherit cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={busy}
            >
              {busy ? "Creating…" : "Create account"}
            </button>

            <p className="mt-0.5 mb-0 text-sm opacity-85">
              Already have an account?{" "}
              <Link className="underline bg-transparent p-0" to="/signin">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
