import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { FaClipboardList } from "react-icons/fa";

export default function Admin() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const attRes = await API.get("/admin/attendance");

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
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <FaClipboardList className="text-emerald-600" />
            Recent Attendance
          </h2>

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
      </div>
    </Layout>
  );
}