import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Login, Register, ForgotPassword, ResetPassword, VerifyEmail } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import ServiceDetail from "./pages/ServiceDetail";
import MarketplaceSearch from "./pages/MarketplaceSearch";
import BuyerAccount from "./pages/BuyerAccount";
import MarketplaceMessages from "./pages/MarketplaceMessages";
import { BuyerSignIn, BuyerRegister } from "./pages/BuyerAccess";

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/signin" replace />;
}

function RoleRoute({ role, children }) {
  if (!localStorage.getItem("token")) return <Navigate to="/signin" replace />;
  return localStorage.getItem("role") === role ? children : <Navigate to={localStorage.getItem("role") === "buyer" ? "/" : "/dashboard"} replace />;
}

function LegacyDashboard() {
  const role = localStorage.getItem("role");
  const path = window.location.pathname;
  if (role === "buyer") {
    if (path.includes("requests")) return <Navigate to="/account/rfps" replace />;
    if (path.includes("vendors")) return <Navigate to="/search" replace />;
    return <Navigate to="/" replace />;
  }
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/"                     element={<Landing />} />
              <Route path="/services/:id"         element={<ServiceDetail />} />
              <Route path="/search"               element={<MarketplaceSearch />} />
              <Route path="/home"                 element={<Navigate to="/" replace />} />
              <Route path="/signin"               element={<BuyerSignIn />} />
              <Route path="/register"             element={<BuyerRegister />} />
              <Route path="/vendor/register"      element={<Login initialPhase="quiz" />} />
              <Route path="/forgot-password"      element={<ForgotPassword />} />
              <Route path="/reset-password"       element={<ResetPassword />} />
              <Route path="/verify-email"         element={<VerifyEmail />} />
              <Route path="/account"              element={<RoleRoute role="buyer"><BuyerAccount /></RoleRoute>} />
              <Route path="/account/:section"     element={<RoleRoute role="buyer"><BuyerAccount /></RoleRoute>} />
              <Route path="/account/rfps/:id"     element={<RoleRoute role="buyer"><BuyerAccount /></RoleRoute>} />
              <Route path="/messages"             element={<ProtectedRoute><MarketplaceMessages /></ProtectedRoute>} />
              <Route path="/messages/:id"         element={<ProtectedRoute><MarketplaceMessages /></ProtectedRoute>} />
              <Route path="/dashboard"            element={<LegacyDashboard />} />
              <Route path="/dashboard/:tab"       element={<LegacyDashboard />} />
              <Route path="/dashboard/:tab/:sub"  element={<LegacyDashboard />} />
              <Route path="*"                     element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
