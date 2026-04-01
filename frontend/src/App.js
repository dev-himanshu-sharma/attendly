import { BrowserRouter, Routes, Route } from "react-router-dom";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoutes.js";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";



function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <ProtectedRoute role="admin">
      <Admin />
    </ProtectedRoute>
  }
/>

<Route
  path="/attendance"
  element={
    <ProtectedRoute>
      <Attendance />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;