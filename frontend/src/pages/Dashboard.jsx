import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import {
  FaCalendarAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaChartBar
} from "react-icons/fa";

export default function Dashboard() {
  const { user, logout, biometricRegister, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDays: 0,
    totalHours: 0
  });
  const [biometricMessage, setBiometricMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/attendance/me");
        calculateStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };

    fetchStats();
  }, []);

  const requestBiometric = async () => {
    try {
      const res = await biometricRegister();
      setBiometricMessage(res.message);
    } catch (err) {
      setBiometricMessage(err.response?.data?.message || "Unable to register biometric data.");
    }
  };

  const calculateStats = (records) => {
    const total = records.reduce((acc, rec) => {
      return acc + (parseFloat(rec.workHours) || 0);
    }, 0);

    const days = records.length;

    setStats({
      totalDays: days,
      totalHours: total.toFixed(1)
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome,{" "}
              <span className="text-indigo-600">
                {user?.name || "User"}
              </span>
            </h1>

            <p className="text-gray-500 mt-1 font-medium capitalize">
              Account Role: {user?.role}
            </p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <FaChartBar />
                <p className="opacity-80 text-xs font-bold uppercase tracking-widest">
                  Total Time Worked
                </p>
              </div>

              <h2 className="text-6xl font-black mt-3">
                {stats.totalHours}{" "}
                <span className="text-xl font-normal opacity-70">
                  hrs
                </span>
              </h2>

              <div className="mt-6 bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(stats.totalHours, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              Days Present
            </p>

            <h2 className="text-5xl font-black text-gray-800 mt-3">
              {stats.totalDays}
            </h2>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              Current Status
            </p>

            <h2 className="text-2xl font-bold text-emerald-600 mt-3 flex items-center gap-3">
              <span className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></span>
              Active Now
            </h2>

            <p className="text-gray-400 text-xs mt-2 italic">
              Standard shift: 09:00 - 18:00
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/attendance")}
            className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
              <FaCalendarAlt />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
              Daily Attendance
            </h3>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Check in for your shift, clock out, and view your monthly
              history logs.
            </p>
          </button>

          {user?.role === "admin" ? (
            <button
              onClick={() => navigate("/admin")}
              className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
            >
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                <FaShieldAlt />
              </div>

              <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                Admin Control
              </h3>

              <p className="text-gray-500 mt-2 leading-relaxed">
                Manage verification requests and review attendance.
              </p>
            </button>
          ) : (
            <button
              onClick={requestBiometric}
              className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
            >
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                <FaShieldAlt />
              </div>

              <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                Biometric Login Request
              </h3>

              <p className="text-gray-500 mt-2 leading-relaxed">
                Request biometric access for quick login once approved by an admin.
              </p>

              <button
                type="button"
                onClick={requestBiometric}
                className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
              >
                Register Biometric Data
              </button>

              {biometricMessage && (
                <div className="mt-4 text-sm text-gray-700 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  {biometricMessage}
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}