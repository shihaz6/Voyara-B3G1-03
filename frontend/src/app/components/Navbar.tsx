import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, User, LogIn, UserPlus, LayoutDashboard, LogOut, HelpCircle, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.roles.includes("ADMIN");
  const isTourist = user?.roles.includes("TOURIST");
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Traveler";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <nav style={{ borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-50 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer select-none">
            <img src={logoImg} alt="Voyara" className="h-12 w-auto object-contain" />
          </Link>

          {/* Right — globe + profile button only */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-2 hover:shadow-md transition-shadow"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <Menu className="w-4 h-4 text-gray-700" />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: isAuthenticated ? "linear-gradient(135deg, #FF385C, #E31C5F)" : "#6b7280" }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-2xl py-2 w-64 z-50" style={{ border: "1px solid #e5e7eb" }}>
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <p className="text-xs text-gray-400">Welcome back, {firstName}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#fff5f7", color: "#FF385C" }}>Admin</span>
                        )}
                        {isTourist && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#eff6ff", color: "#0057B8" }}>Tourist</span>
                        )}
                      </div>
                      {isAdmin && (
                        <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                          style={{ color: "#FF385C" }}>
                          <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                        </Link>
                      )}
                      {isTourist && (
                        <>
                          <Link to="/" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                            style={{ color: "#FF385C" }}>
                            <Search className="w-4 h-4" /> Explore trips
                          </Link>
                          <Link to="/tourist/dashboard" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                            style={{ color: "#0057B8" }}>
                            <LayoutDashboard className="w-4 h-4" /> My Bookings
                          </Link>
                        </>
                      )}
                      <div style={{ borderTop: "1px solid #f0f0f0" }} className="mt-1 pt-1">
                        <Link to="/help" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <HelpCircle className="w-4 h-4 text-gray-400" /> Help Center
                        </Link>
                      </div>
                      <div style={{ borderTop: "1px solid #f0f0f0" }} className="mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LogOut className="w-4 h-4 text-gray-400" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                        <LogIn className="w-4 h-4 text-gray-500" /> Log in
                      </Link>
                      <Link to="/login?mode=signup" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <UserPlus className="w-4 h-4 text-gray-400" /> Sign up
                      </Link>
                      <div style={{ borderTop: "1px solid #f0f0f0" }} className="mt-1 pt-1">
                        <Link to="/help" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <HelpCircle className="w-4 h-4 text-gray-400" /> Help Center
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
