import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Login, Register, ForgotPassword, VerifyEmail } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/"               element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email"   element={<VerifyEmail />} />
            <Route path="/dashboard/*"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
