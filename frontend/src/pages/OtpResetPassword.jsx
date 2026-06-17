import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function OtpResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await API.post("/auth/password-reset-request", { email });
      setStatus(res.data.message || "OTP sent to your email.");
      setOtpSent(true);
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await API.post("/auth/password-reset", {
        token: otp,
        password,
      });
      setStatus(res.data.message || "Password reset successful.");
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">OTP Password Reset</h2>
          <p className="text-gray-500 mt-2">Enter your email to receive OTP, then create a new password.</p>
        </div>

        <form onSubmit={otpSent ? resetPassword : sendOtp} className="space-y-5">
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

          {otpSent && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">OTP</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">New Password</label>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-11 text-sm text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"}`}
          >
            {loading ? (otpSent ? "Resetting..." : "Sending OTP...") : (otpSent ? "Reset Password" : "Send OTP")}
          </button>
        </form>

        {status && (
          <div className="mt-6 text-sm text-gray-700 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
