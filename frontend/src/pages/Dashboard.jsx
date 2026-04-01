// import { useContext } from "react";
// import { AuthContext } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import Layout from "../components/Layout";

// export default function Dashboard() {
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   return (
//     <Layout>
//       <div className="max-w-5xl mx-auto px-4 py-8">
//         <div className="flex justify-between items-center mb-10">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.name || "User"}</h1>
//             <p className="text-gray-500 capitalize">Role: {user?.role}</p>
//           </div>
//           <button onClick={() => { logout(); navigate("/"); }} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Logout</button>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//           <button onClick={() => navigate("/attendance")} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all text-left group">
//             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-all">📅</div>
//             <h3 className="text-xl font-bold text-gray-800">Attendance</h3>
//             <p className="text-gray-500 text-sm mt-1">Log your time and view history.</p>
//           </button>

//           {user?.role === "admin" && (
//             <button onClick={() => navigate("/admin")} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all text-left group">
//               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">🛡️</div>
//               <h3 className="text-xl font-bold text-gray-800">Admin Panel</h3>
//               <p className="text-gray-500 text-sm mt-1">Manage users and global logs.</p>
//             </button>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// }


import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalDays: 0, totalHours: 0 });

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

  const calculateStats = (records) => {
  // 1. Sum up the pre-calculated workHours from the backend
  const total = records.reduce((acc, rec) => {
    // We use parseFloat to ensure it treats the value as a number
    return acc + (parseFloat(rec.workHours) || 0);
  }, 0);

  // 2. Count only valid days (where a check-in occurred)
  const days = records.length;

  // 3. Update the UI state
  setStats({ 
    totalDays: days, 
    totalHours: total.toFixed(1) // Shows 1 decimal place like "8.5"
  });
};

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome, <span className="text-indigo-600">{user?.name || "User"}</span>
            </h1>
            <p className="text-gray-500 mt-1 font-medium capitalize">
              Account Role: {user?.role}
            </p>
          </div>
          <button 
            onClick={() => { logout(); navigate("/"); }} 
            className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Work Hours Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="opacity-80 text-xs font-bold uppercase tracking-widest">Total Time Worked</p>
              <h2 className="text-6xl font-black mt-3">{stats.totalHours} <span className="text-xl font-normal opacity-70">hrs</span></h2>
              <div className="mt-6 bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-1000" style={{width: `${Math.min(stats.totalHours, 100)}%`}}></div>
              </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Days Present</p>
            <h2 className="text-5xl font-black text-gray-800 mt-3">{stats.totalDays}</h2>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Current Status</p>
            <h2 className="text-2xl font-bold text-emerald-600 mt-3 flex items-center gap-3">
              <span className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></span>
              Active Now
            </h2>
            <p className="text-gray-400 text-xs mt-2 italic">Standard shift: 09:00 - 18:00</p>
          </div>
        </div>

        {/* Quick Actions Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate("/attendance")} 
            className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
              📅
            </div>
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Daily Attendance</h3>
            <p className="text-gray-500 mt-2 leading-relaxed">Check in for your shift, clock out, and view your monthly history logs.</p>
          </button>

          {user?.role === "admin" && (
            <button 
              onClick={() => navigate("/admin")} 
              className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
            >
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                🛡️
              </div>
              <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Admin Control</h3>
              <p className="text-gray-500 mt-2 leading-relaxed">Manage company users, delete accounts, and monitor global attendance logs.</p>
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}