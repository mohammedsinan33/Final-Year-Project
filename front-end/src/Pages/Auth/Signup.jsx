import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { ArrowRight, Mail, Lock, User, Briefcase, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Continental AI today</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
          <form className="space-y-4" onSubmit={onRegisterSubmit}>
            {/* Full Name Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-emerald-600" />
                  Full Name
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-600" />
                  I am a...
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  role === "jobseeker" 
                    ? "border-emerald-600 bg-emerald-50" 
                    : "border-gray-200 bg-white hover:border-emerald-200"
                }`}>
                  <input
                    type="radio"
                    value="jobseeker"
                    checked={role === "jobseeker"}
                    onChange={(e) => setRole(e.target.value)}
                    className="hidden"
                  />
                  <span className="block text-center font-semibold text-gray-900">👤 Job Seeker</span>
                </label>
                <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  role === "recruiter" 
                    ? "border-emerald-600 bg-emerald-50" 
                    : "border-gray-200 bg-white hover:border-emerald-200"
                }`}>
                  <input
                    type="radio"
                    value="recruiter"
                    checked={role === "recruiter"}
                    onChange={(e) => setRole(e.target.value)}
                    className="hidden"
                  />
                  <span className="block text-center font-semibold text-gray-900">💼 Recruiter</span>
                </label>
              </div>
            </div>

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
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
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
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">At least 6 characters recommended</p>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-emerald-300 text-emerald-600 mt-1" required />
              <span className="text-sm text-gray-600">
                I agree to the <Link to="#" className="text-emerald-600 hover:underline">Terms of Service</Link> and{" "}
                <Link to="#" className="text-emerald-600 hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {/* Sign Up Button */}
            <button
              className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={20} />
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

          {/* Social Signup Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 px-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-gray-700 font-medium text-sm">
              Google
            </button>
            <button className="py-2.5 px-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-gray-700 font-medium text-sm">
              GitHub
            </button>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
            Sign in here
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
