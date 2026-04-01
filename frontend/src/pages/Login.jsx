import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      login(res.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg mb-4 text-xl font-bold">A</div>
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email</label>
            <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <button type="button" className="text-xs text-blue-600 hover:underline">Forgot?</button>
            </div>
            <input required type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98] disabled:bg-blue-300">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}