import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { FaClipboardList, FaUserCheck } from "react-icons/fa";

export default function Admin() {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("descending");

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (sortOrder) params.append("sortBy", sortOrder);

      const attRes = await API.get(`/admin/attendance?${params.toString()}`);

      setAttendance(
        Array.isArray(attRes.data) ? attRes.data : []
      );
    } catch (err) {
      console.error("Admin Fetch Error:", err);
      setError(
        "Failed to load data. Please check if the server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const params = new URLSearchParams();
      if (emailSearch) params.append("email", emailSearch);
      const res = await API.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Users Fetch Error:", err);
      setUsersError("Unable to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  const verifyEmail = async (id) => {
    try {
      await API.post(`/admin/users/${id}/verify-email`);
      fetchUsers();
    } catch (err) {
      console.error("Error verifying email:", err);
    }
  };

  const approveBiometric = async (id) => {
    try {
      await API.post(`/admin/users/${id}/approve-biometric`);
      fetchUsers();
    } catch (err) {
      console.error("Error approving biometric:", err);
    }
  };

  const rejectBiometric = async (id) => {
    try {
      await API.post(`/admin/users/${id}/reject-biometric`);
      fetchUsers();
    } catch (err) {
      console.error("Error rejecting biometric:", err);
    }
  };

  const pendingEmailCount = users.filter((user) => !user.isEmailVerified).length;
  const pendingBiometricCount = users.filter((user) => user.biometricEnabled && !user.biometricApproved).length;

  const formatLocation = (loc) => {
    if (!loc?.lat || !loc?.lng) return "Unknown";
    if (loc?.locationName) return loc.locationName;
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  };

  const formatTimestamp = (value) => {
    if (!value) return "Never";
    return new Date(value).toLocaleString();
  };

  const handleFilterAttendance = () => {
    fetchData();
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

          <button
            onClick={fetchData}
            className="ml-4 underline font-bold"
          >
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
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin Panel
          </h1>

          <p className="text-gray-500">
            System overview and attendance monitoring.
          </p>
        </div>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-semibold uppercase text-gray-500">Pending Email Verifications</p>
              <p className="mt-4 text-4xl font-extrabold text-gray-900">{pendingEmailCount}</p>
              <p className="text-sm text-gray-500 mt-2">Users waiting for admin email approval.</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-semibold uppercase text-gray-500">Pending Biometric Requests</p>
              <p className="mt-4 text-4xl font-extrabold text-gray-900">{pendingBiometricCount}</p>
              <p className="text-sm text-gray-500 mt-2">Biometric login requests awaiting approval.</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <FaClipboardList className="text-emerald-600" />
            Attendance Records
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                >
                  <option value="descending">Newest First</option>
                  <option value="ascending">Oldest First</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFilterAttendance}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                    Name
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Check In
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Check Out
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
                    <tr
                      key={a._id}
                      className="hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">
                        {a.userId?.name ||
                          a.userId?.email ||
                          "Unknown User"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 text-center">
                        {a.date}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {a.checkIn
                          ? new Date(
                              a.checkIn
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {a.checkOut
                          ? new Date(
                              a.checkOut
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Active"}
                      </td>

                      <td className="px-6 py-4 text-center font-bold">
                        {a.workHours
                          ? `${a.workHours}h`
                          : "0h"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            a.status === "Present"
                              ? "bg-green-100 text-green-700"
                              : a.status === "Late"
                              ? "bg-yellow-100 text-yellow-700"
                              : a.status === "Absent"
                              ? "bg-red-100 text-red-700"
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

        <section className="pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <FaUserCheck className="text-blue-600" />
              User Management
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <input
              type="text"
              placeholder="Search by email..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {usersLoading ? (
            <div className="text-gray-500">Loading users...</div>
          ) : usersError ? (
            <div className="text-red-600">{usersError}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Verified</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Biometric</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">IP Address</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm text-gray-700">{user.name || "—"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{user.isEmailVerified ? "Yes" : "No"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {user.biometricEnabled ? "Requested" : "Off"} / {user.biometricApproved ? "Approved" : "Pending"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatTimestamp(user.lastLoginLocation?.updatedAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatLocation(user.lastLoginLocation)}
                      </td>
                      <td className="px-4 py-4 text-gray-700 font-mono text-xs">
                        {user.lastLoginIP || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 space-y-2">
                        {!user.isEmailVerified && (
                          <button
                            onClick={() => verifyEmail(user._id)}
                            className="block px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 w-full"
                          >
                            Verify Email
                          </button>
                        )}
                        {user.biometricEnabled && !user.biometricApproved && (
                          <>
                            <button
                              onClick={() => approveBiometric(user._id)}
                              className="block px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 w-full"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectBiometric(user._id)}
                              className="block px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 w-full"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}