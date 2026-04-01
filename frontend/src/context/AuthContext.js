import { createContext, useState, useEffect } from "react";

// Create Context
export const AuthContext = createContext();

// Provider Component
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Run on app load
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Decode JWT payload
        const payload = JSON.parse(atob(token.split(".")[1]));

        setUser(payload); // { id, role }
      } catch (err) {
        console.log("Invalid token");
        logout();
      }
    }
  }, []);

  // Login function
  const login = (token) => {
    localStorage.setItem("token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser(payload);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}