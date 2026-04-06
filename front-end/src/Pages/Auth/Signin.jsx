import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { ArrowRight, Mail, Lock, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your AI Recruiter Pro account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
          <form className="space-y-5" onSubmit={onLoginSubmit}>
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-emerald-600" />
                  Email Address
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-emerald-600" />
                  Password
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-emerald-300 text-emerald-600" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 px-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-gray-700 font-medium text-sm">
              Google
            </button>
            <button className="py-2.5 px-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-gray-700 font-medium text-sm">
              GitHub
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
            Create one now
          </Link>
        </p>

        {/* Footer Links */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
          <Link to="#" className="hover:text-emerald-600">Terms</Link>
          <span>•</span>
          <Link to="#" className="hover:text-emerald-600">Privacy</Link>
          <span>•</span>
          <Link to="#" className="hover:text-emerald-600">Contact</Link>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse" style={{animationDelay: '2s'}}></div>
    </div>
  );
}
