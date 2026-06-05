import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  FaChartBar,
  FaCalendarAlt,
  FaShieldAlt,
  FaSignOutAlt
} from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getNavLinkClass = (path) => {
    const isActive = location.pathname === path;

    return `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
      ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`;
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 p-6 flex flex-col shadow-sm">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-indigo-200 shadow-lg">
          A
        </div>

        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Attendly
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        <button
          onClick={() => navigate("/dashboard")}
          className={getNavLinkClass("/dashboard")}
        >
          <FaChartBar className="text-lg" />
          Dashboard
        </button>

        <button
          onClick={() => navigate("/attendance")}
          className={getNavLinkClass("/attendance")}
        >
          <FaCalendarAlt className="text-lg" />
          Attendance
        </button>

        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className={getNavLinkClass("/admin")}
          >
            <FaShieldAlt className="text-lg" />
            Admin Panel
          </button>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="px-2 mb-4">
          <p className="text-sm font-bold text-gray-900 truncate">
            {user?.name || "User"}
          </p>

          <p className="text-xs text-gray-500 truncate capitalize">
            {user?.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all group"
        >
          <FaSignOutAlt className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );
}