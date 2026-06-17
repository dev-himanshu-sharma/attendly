import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await API.post("/auth/password-reset-request", { email });
      setStatus(res.data.message || "Password reset requested. Check your email or admin for the reset token.");
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="text-gray-500 mt-2">Enter your email and we will send an OTP to your Gmail.</p>
        </div>

        <form onSubmit={handleRequest} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"}`}
          >
            {loading ? "Sending..." : "Request Reset"}
          </button>
        </form>

        {status && (
          <div className="mt-6 text-sm text-gray-700 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {status}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-blue-600 font-bold hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
