import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function Signin() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  function goByRole(userRole) {
    nav(userRole === "recruiter" ? "/recruiter" : "/jobseeker", { replace: true });
  }

  async function onLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(loginEmail, loginPassword);
      goByRole(user.role);
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch justify-center p-6 max-[420px]:p-3.5">
      <div className="w-full max-w-[520px] flex items-stretch">
        <div className="w-full border border-white/10 bg-white/5 rounded-2xl p-[22px] text-left max-[420px]:p-4">
          <div className="mb-3.5">
            <h2 className="m-0 text-xl">Welcome back</h2>
            <p className="mt-1.5 mb-0 text-sm opacity-80">Use your email and password.</p>
          </div>

          {error ? (
            <div className="rounded-xl p-2.5 bg-red-600/20 border border-red-500/40 mb-3" role="alert">
              {error}
            </div>
          ) : null}

          <form className="grid gap-3" onSubmit={onLoginSubmit}>
            <label className="grid gap-1.5 min-w-0">
              <span className="text-[13px] opacity-90">Email</span>
              <input
                className="w-full max-w-full min-w-0 rounded-xl px-3 py-2.5 border border-white/20 bg-black/20 text-inherit outline-none focus:border-indigo-400/90 focus:ring-2 focus:ring-indigo-500/20"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>

            <button
              className="mt-1 rounded-xl px-3 py-2.5 border border-indigo-400/60 bg-indigo-500/20 text-inherit cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <p className="mt-0.5 mb-0 text-sm opacity-85">
              New here?{" "}
              <Link className="underline bg-transparent p-0" to="/signup">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
