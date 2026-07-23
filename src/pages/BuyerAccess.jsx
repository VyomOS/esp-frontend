import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../api/api";
import { MarketplaceLogo } from "../components/MarketplaceHeader";
import { useAuth } from "../context/AuthContext";

const safePath = value => value?.startsWith("/") && !value.startsWith("//") ? value : "/";

function BuyerAccessShell({ mode, children }) {
  return <div className="buyer-access-page">
    <header className="buyer-access-header"><Link to="/" aria-label="Even Procurement home"><MarketplaceLogo /></Link><div><span>Buying for your business?</span><Link to={mode === "signin" ? "/register" : "/signin"}>{mode === "signin" ? "Create buyer account" : "Sign in"}</Link></div></header>
    <main className="buyer-access-main">
      <section className="buyer-access-story"><span>EVEN PROCUREMENT FOR BUYERS</span><h1>Source business services with confidence.</h1><p>Discover verified providers, save services, publish requirements, compare quotes and speak directly with matched vendors.</p><div><article><b>01</b><span>Discover</span><small>Search services and verified suppliers</small></article><article><b>02</b><span>Compare</span><small>Review prices, proposals and trust signals</small></article><article><b>03</b><span>Connect</span><small>Manage RFPs and vendor conversations</small></article></div></section>
      <section className="buyer-access-card">{children}</section>
    </main>
    <footer className="buyer-access-footer">Buyer access is separate from vendor verification and onboarding. <Link to="/vendor/register">Join as a vendor</Link></footer>
  </div>;
}

function Field({ label, error, ...props }) {
  return <label className="buyer-access-field"><span>{label}</span><input {...props} aria-invalid={Boolean(error)} />{error && <small>{error}</small>}</label>;
}

export function BuyerSignIn() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" }); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async event => { event.preventDefault(); setError(""); setLoading(true); try { const user = await login(form.email, form.password); const requested = params.get("returnTo") || sessionStorage.getItem("espReturnTo"); sessionStorage.removeItem("espReturnTo"); navigate(user.role === "buyer" ? safePath(requested) : "/dashboard", { replace: true }); } catch (err) { setError(err.response?.data?.detail || "We could not sign you in. Check your email and password."); } finally { setLoading(false); } };
  return <BuyerAccessShell mode="signin"><div className="buyer-access-heading"><span>BUYER SIGN IN</span><h2>Welcome back</h2><p>Continue to the same marketplace you were browsing.</p></div><form onSubmit={submit}><Field label="Work email" type="email" autoComplete="email" placeholder="you@company.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><Field label="Password" type="password" autoComplete="current-password" placeholder="Your password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><div className="buyer-auth-row"><span className="buyer-auth-note">Secure buyer access</span><Link to="/forgot-password">Forgot password?</Link></div>{error && <div className="buyer-auth-error" role="alert">{error}</div>}<button className="buyer-auth-submit" disabled={loading}>{loading ? <><i className="button-spinner" /> Signing in…</> : "Sign in"}</button></form><div className="buyer-auth-switch">New to Even Procurement? <Link to={`/register${params.toString() ? `?${params}` : ""}`}>Create a buyer account</Link></div></BuyerAccessShell>;
}

export function BuyerRegister() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { acceptSession } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" }); const [errors, setErrors] = useState({}); const [loading, setLoading] = useState(false);
  const submit = async event => { event.preventDefault(); const next = {}; if (form.name.trim().length < 2) next.name = "Enter your full name"; if (!form.email.includes("@")) next.email = "Enter a valid work email"; if (form.password.length < 8) next.password = "Use at least 8 characters"; if (form.password !== form.confirm) next.confirm = "Passwords do not match"; setErrors(next); if (Object.keys(next).length) return; setLoading(true); try { const response = await authAPI.registerBuyer({ name: form.name.trim(), email: form.email, password: form.password }); acceptSession(response.data); const requested = params.get("returnTo") || sessionStorage.getItem("espReturnTo"); sessionStorage.removeItem("espReturnTo"); navigate(safePath(requested), { replace: true }); } catch (err) { setErrors({ email: err.response?.data?.detail || "Account creation failed. Please try again." }); } finally { setLoading(false); } };
  return <BuyerAccessShell mode="register"><div className="buyer-access-heading"><span>CREATE BUYER ACCOUNT</span><h2>Start sourcing in minutes</h2><p>No quiz. Create your buyer account and continue browsing.</p></div><form onSubmit={submit}><Field label="Full name" autoComplete="name" placeholder="Your name" required value={form.name} error={errors.name} onChange={e => setForm({ ...form, name: e.target.value })} /><Field label="Work email" type="email" autoComplete="email" placeholder="you@company.com" required value={form.email} error={errors.email} onChange={e => setForm({ ...form, email: e.target.value })} /><Field label="Create password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required value={form.password} error={errors.password} onChange={e => setForm({ ...form, password: e.target.value })} /><Field label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your password" required value={form.confirm} error={errors.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /><p className="buyer-auth-terms">By continuing, you agree to use the marketplace for legitimate business procurement. We will also send a verification email.</p><button className="buyer-auth-submit" disabled={loading}>{loading ? <><i className="button-spinner" /> Creating account…</> : "Create buyer account"}</button></form><div className="buyer-auth-switch">Already registered? <Link to="/signin">Sign in</Link></div></BuyerAccessShell>;
}
