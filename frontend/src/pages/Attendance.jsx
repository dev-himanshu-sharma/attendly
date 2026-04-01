import { useState, useEffect } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function Attendance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentHour = new Date().getHours();

  // Constraints for UI Buttons
  const canCheckIn = currentHour >= 9 && currentHour < 18; // 9 AM to 6 PM
  const canCheckOut = currentHour >= 18; // After 6 PM
// Inside Attendance.jsx
// Change these to 'true' so you can click them anytime for testing
 

// If you want to simulate 10:20 PM Check-in specifically:
// Just click 'Check In' when your clock hits 10:20 PM.
  useEffect(() => {
    getAttendance();
  }, []);

  const getAttendance = async () => {
    try {
      const res = await API.get("/attendance/me");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching attendance", err);
    }
  };

  const handleAction = async (type) => {
    setLoading(true);
    try {
      if (type === 'checkin') {
        // Backend handles "Late" vs "Present" based on 9:15 AM threshold
        await API.post("/attendance");
      } else {
        const today = new Date().toISOString().split("T")[0];
        const activeRecord = data.find(item => item.date === today && !item.checkOut);

        if (!activeRecord) {
          alert("No active check-in found for today!");
          setLoading(false);
          return;
        }

        // Corrected URL to match: router.put("/checkout/:id")
        await API.put(`/attendance/checkout/${activeRecord._id}`);
      }

      alert("Success!");
      getAttendance(); 
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Attendance Center</h1>
        <p className="text-gray-500 mb-8 font-medium">Standard Hours: 09:00 AM - 06:00 PM (15 min grace period)</p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className={`p-6 rounded-3xl border transition-all ${canCheckIn ? 'bg-white shadow-xl shadow-indigo-50 border-indigo-50' : 'bg-gray-50 opacity-60'}`}>
            <h3 className="font-bold text-lg mb-1">Morning Entry</h3>
            <p className="text-xs text-indigo-500 font-bold mb-4 uppercase tracking-wider">Before 09:15 AM for "Present"</p>
            <button 
              disabled={!canCheckIn || loading}
              onClick={() => handleAction('checkin')}
              className={`w-full py-4 rounded-2xl font-black text-white transition-all 
                ${canCheckIn ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {loading ? "Processing..." : canCheckIn ? "Check In" : "Closed"}
            </button>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${canCheckOut ? 'bg-white shadow-xl shadow-emerald-50 border-emerald-50' : 'bg-gray-50 opacity-60'}`}>
            <h3 className="font-bold text-lg mb-1">Evening Exit</h3>
            <p className="text-xs text-emerald-500 font-bold mb-4 uppercase tracking-wider">Available after 06:00 PM</p>
            <button 
              disabled={!canCheckOut || loading}
              onClick={() => handleAction('checkout')}
              className={`w-full py-4 rounded-2xl font-black text-white transition-all 
                ${canCheckOut ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {loading ? "Processing..." : canCheckOut ? "Check Out" : "Locked until 6 PM"}
            </button>
          </div>
        </div>
        
        {/* Table Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Check In</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Check Out</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700">
                      {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm text-gray-600">
                         {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm text-gray-600">
                         {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                        item.status === "Present" ? "bg-green-100 text-green-700" :
                        item.status === "Late" ? "bg-yellow-100 text-yellow-700" :
                        item.status === "Half-day" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}