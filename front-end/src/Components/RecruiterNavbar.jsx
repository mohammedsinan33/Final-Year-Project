import { LogOut, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../Services/database";

export default function RecruiterNavbar({ displayName }) {
  const nav = useNavigate();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">AI Recruiter Pro</h1>
            <p className="text-xs text-gray-500">Recruiter Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">
            Welcome, <span className="text-emerald-600">{displayName}</span>
          </span>
          <button
            onClick={() => {
              (async () => {
                await logout();
                nav("/", { replace: true }); // ✅ Go to home
              })();
            }}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}