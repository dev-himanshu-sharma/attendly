import { useEffect, useState, useContext } from "react";

import API from "../services/api";

import Layout from "../components/Layout";

import { AuthContext } from "../context/AuthContext.js";

export default function Admin() {
  const [users, setUsers] = useState([]);

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      setError(null);

      // Fetching both at once

      const [usersRes, attRes] = await Promise.all([
        API.get("/admin/users"),

        API.get("/admin/attendance"),
      ]);

      // Defensive check: ensure the response is actually an array

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);

      setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    } catch (err) {
      console.error("Admin Fetch Error:", err);

      setError("Failed to load data. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      // 1. Tell the backend to delete

      await API.delete(`/admin/user/${id}`);

      // 2. Remove from the "Users" table in the UI

      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== id));

      // 3. 🔥 THE MISSING PIECE: Remove from the "Recent Attendance" table in the UI

      // We filter out any attendance record where the userId matches the one we just deleted

      setAttendance((prevAttendance) =>
        prevAttendance.filter((record) => record.userId?._id !== id),
      );

      console.log("User and their local attendance records removed.");
    } catch (err) {
      console.error("Delete failed:", err);

      alert("Could not delete user.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-gray-500 font-medium">
          Loading Admin Data...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100">
          {error}

          <button onClick={fetchData} className="ml-4 underline font-bold">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-10 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Panel</h1>

          <p className="text-gray-500">System overview and user management.</p>
        </div>

        {/* Users Section */}

        {/* Attendance Section */}

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-600 rounded-full"></span>
            Recent Attendance
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Name
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    In
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Out
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Hours
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {attendance.length > 0 ? (
                  attendance.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800 capitalize">
                        {a.userId?.name || a.userId?.email || "Unknown User"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 text-center">
                        {a.date}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-black">
                          {a.checkIn
                            ? new Date(a.checkIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {a.checkOut ? (
                          <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-black">
                            {new Date(a.checkOut).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs italic font-medium">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center font-mono font-bold text-gray-700 text-sm">
                        {a.workHours ? `${a.workHours}h` : "0h"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            a.status === "Present"
                              ? "bg-green-100 text-green-700"
                              : a.status === "Late"
                                ? "bg-yellow-100 text-yellow-700"
                                : a.status === "Absent"
                                  ? "bg-red-100 text-red-700" // Red for Absent
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}
