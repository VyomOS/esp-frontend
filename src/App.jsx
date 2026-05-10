import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Login, Register, ForgotPassword, VerifyEmail } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/"                     element={<Login />} />
              <Route path="/home"                 element={<Landing />} />
              <Route path="/register"             element={<Register />} />
              <Route path="/forgot-password"      element={<ForgotPassword />} />
              <Route path="/verify-email"         element={<VerifyEmail />} />
              <Route path="/dashboard"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:tab"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:tab/:sub"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="*"                     element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
