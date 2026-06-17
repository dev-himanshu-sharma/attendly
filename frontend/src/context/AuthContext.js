import { createContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      API.get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          logout();
        });
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch (err) {
      console.log("Invalid token", err);
      logout();
    }
  };

  const biometricRegister = async () => {
    const res = await API.post("/auth/biometric-register");
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, biometricRegister, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}