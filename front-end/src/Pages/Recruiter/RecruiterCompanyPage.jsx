import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { saveRecruiterProfile } from "../../Services/database";
import { ArrowRight, Building2, Globe, Users, MapPin, Zap, Briefcase } from "lucide-react";

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
      // Save to database via RPC
      await saveRecruiterProfile(user.id, {
        companyName,
        companyDomain,
        industry,
        companySize,
        headquarters,
      });
      
      // Also save to localStorage as backup
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
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 flex items-center justify-center p-6 py-12">
      {/* Background Elements */}
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
          <h1 className="text-4xl font-black text-gray-900 mb-3">Company Setup</h1>
          <p className="text-xl text-gray-600">Tell us about your company to get started</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-emerald-100">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-600" />
                  Company Name *
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                type="text"
                placeholder="e.g., Continental"
                required
                autoFocus
              />
            </div>

            {/* Company Domain */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-emerald-600" />
                  Company Domain *
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                type="text"
                placeholder="e.g., continental.com"
                required
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-600" />
                  Industry (Optional)
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                type="text"
                placeholder="e.g., Automotive / Software"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" />
                  Company Size (Optional)
                </div>
              </label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
              >
                <option value="">Select company size</option>
                <option value="1-50">1–50 employees</option>
                <option value="51-200">51–200 employees</option>
                <option value="201-500">201–500 employees</option>
                <option value="501-1000">501–1,000 employees</option>
                <option value="1000+">1,000+ employees</option>
              </select>
            </div>

            {/* Headquarters */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-600" />
                  Headquarters (Optional)
                </div>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400"
                value={headquarters}
                onChange={(e) => setHeadquarters(e.target.value)}
                type="text"
                placeholder="e.g., Bengaluru, India"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up...
                </>
              ) : (
                <>
                  Continue to Dashboard <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">You can update this information later</p>
      </div>
    </div>
  );
}
