import { Zap, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../Services/database';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const firstName = user?.fullName ? String(user.fullName).trim().split(/\s+/)[0] : '';

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-md z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600">
          <Zap className="animate-spin" size={28} />
          <span>Continental AI</span>
        </div>
        <ul className="hidden md:flex gap-8 items-center">
          <li>
            <a href="#features" className="text-gray-700 font-medium hover:text-emerald-600 transition">
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-gray-700 font-medium hover:text-emerald-600 transition">
              How It Works
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-gray-700 font-medium hover:text-emerald-600 transition">
              Pricing
            </a>
          </li>
          <li>
            {!loading && user ? (
              // User Avatar with Dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-full transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user.fullName)}
                  </div>
                  <span className="text-sm font-medium text-emerald-700">{firstName}</span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      <p className="text-xs text-emerald-600 font-medium mt-2">
                        {user.role === 'recruiter' ? '🏢 Recruiter' : '💼 Job Seeker'}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate(user.role === 'recruiter' ? '/recruiter' : '/jobseeker');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-2 transition"
                      >
                        <User size={16} />
                        Dashboard
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition border-t border-gray-100"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Sign In Button (when not logged in)
              <a href="/signin" className="bg-emerald-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-emerald-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
                Sign In
              </a>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}