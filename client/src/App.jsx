import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import AdminDashboard from "./pages/stdadmin/StdAdminDashboard";
import WebAdminDashboard from "./pages/webadmin/WebAdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

// Guard: redirect to /change-password if the user still has a temp password
function TempPasswordGuard({ children }) {
  const isTempPwd = localStorage.getItem("is_temp_password") === "true";
  const token = localStorage.getItem("token");
  if (token && isTempPwd) return <Navigate to="/change-password" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Force password change route (requires valid token) */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer", "admin_staff", "web_admin"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <TempPasswordGuard><StudentDashboard /></TempPasswordGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <TempPasswordGuard><LecturerDashboard /></TempPasswordGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin_staff"]}>
              <TempPasswordGuard><AdminDashboard /></TempPasswordGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/webadmin"
          element={
            <ProtectedRoute allowedRoles={["web_admin"]}>
              <TempPasswordGuard><WebAdminDashboard /></TempPasswordGuard>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;