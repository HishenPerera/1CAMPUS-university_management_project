import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import AdminDashboard from "./pages/stdadmin/StdAdminDashboard";
import WebAdminDashboard from "./pages/webadmin/WebAdminDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin_staff"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/webadmin"
          element={
            <ProtectedRoute allowedRoles={["web_admin"]}>
              <WebAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;