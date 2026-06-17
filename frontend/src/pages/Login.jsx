import { useState, useContext } from "react";
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

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (locationError) => {
          reject(locationError);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const location = await getCurrentLocation();

      const res = await API.post("/auth/login", {
        email,
        password,
        location,
      });

      login(res.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white">
        <div className="text-center mb-10 ">
          <div className="flex justify-center">
 
</div>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Email
            </label>

            <input
              required
              type="email"
              
              title="Enter a valid email address"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Password
            </label>

            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all disabled:bg-blue-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 grid gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const location = await getCurrentLocation();
                const res = await API.post("/auth/biometric-login", {
                  email,
                  location,
                });
                login(res.data.token);
                navigate("/dashboard", { replace: true });
              } catch (err) {
                const serverMessage = err.response?.data?.message;
                setError(serverMessage || "Biometric login failed.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg transition-all disabled:bg-teal-300"
          >
            {loading ? "Processing biometric..." : "Biometric Login"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Use biometric login only after admin approval and location verification.
          </p>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Forgot your password? {" "}
          <Link to="/forgot-password" className="text-blue-600 font-bold hover:underline">
            Reset it here
          </Link>
        </p>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Don't have an account? {" "}
          <Link
            to="/register"
            className="text-blue-600 font-bold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}