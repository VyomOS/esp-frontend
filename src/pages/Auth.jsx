import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Btn, Input } from "../components/UI";
import ThemePicker from "../components/ThemePicker";

function AuthLayout({ children, title, sub }) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex" }}>
      <div style={{ position:"absolute", top:20, right:20 }}><ThemePicker /></div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
        <div style={{ width:"100%", maxWidth:420, animation:"fadeUp 0.4s ease" }}>
          <div style={{ marginBottom:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
              <div style={{ width:32, height:32, background:"var(--accent)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne", fontWeight:800, fontSize:14, color:"white" }}>E</div>
              <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:16 }}>ESP Platform</div>
            </div>
            <h2 style={{ fontFamily:"Syne", fontSize:28, fontWeight:800, marginBottom:8 }}>{title}</h2>
            <p style={{ color:"var(--text2)", fontSize:14 }}>{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [form, setForm]     = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handle = async () => {
    const e = {};
    if (!form.email)    e.email    = "Required";
    if (!form.password) e.password = "Required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to your ESP account">
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} error={errors.email} icon="✉"/>
        <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handle()} error={errors.password} icon="🔒"/>
        <div style={{textAlign:"right"}}><Link to="/forgot-password" style={{fontSize:13,color:"var(--accent)",textDecoration:"none"}}>Forgot password?</Link></div>
        <Btn onClick={handle} loading={loading} fullWidth size="lg">Sign In</Btn>
        <p style={{textAlign:"center",fontSize:14,color:"var(--text2)"}}>Don't have an account?{" "}<Link to="/register" style={{color:"var(--accent)",fontWeight:600,textDecoration:"none"}}>Create one</Link></p>
      </div>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [form, setForm]   = useState({ name:"", email:"", password:"", role:"buyer" });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await authAPI.register(form);
      setDone(true);
      toast.success("Account created! Check your email to verify.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  if (done) return (
    <AuthLayout title="Check your email" sub="We've sent a verification link">
      <div style={{textAlign:"center",padding:"32px 0"}}>
        <div style={{fontSize:64,marginBottom:20}}>📬</div>
        <p style={{color:"var(--text2)",marginBottom:24,lineHeight:1.7}}>We sent a verification link to <strong style={{color:"var(--text)"}}>{form.email}</strong>. Click it to activate your account, then sign in.</p>
        <Btn onClick={()=>navigate("/")} fullWidth>Go to Login</Btn>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Create account" sub="Join the ESP Platform today">
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Input label="Full name" placeholder="John Doe" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} icon="👤"/>
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} icon="✉"/>
        <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} icon="🔒"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:0.5}}>I am a</label>
          <div style={{display:"flex",gap:8}}>
            {["buyer","vendor"].map(r=>(
              <button key={r} onClick={()=>setForm(p=>({...p,role:r}))}
                style={{flex:1,padding:12,borderRadius:"var(--radius-sm)",border:`2px solid ${form.role===r?"var(--accent)":"var(--border)"}`,background:form.role===r?"rgba(99,132,255,0.1)":"var(--surface)",color:form.role===r?"var(--accent)":"var(--text2)",cursor:"pointer",fontFamily:"Syne",fontWeight:600,fontSize:14,textTransform:"capitalize",transition:"all 0.2s"}}>
                {r==="buyer"?"🛒 ":"🏭 "}{r.charAt(0).toUpperCase()+r.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Btn onClick={handle} loading={loading} fullWidth size="lg">Create Account</Btn>
        <p style={{textAlign:"center",fontSize:14,color:"var(--text2)"}}>Already have an account?{" "}<Link to="/" style={{color:"var(--accent)",fontWeight:600,textDecoration:"none"}}>Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}

export function ForgotPassword() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await authAPI.forgotPassword(email); setSent(true); toast.success("Reset link sent!"); }
    catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset password" sub="We'll send you a reset link">
      {sent ? (
        <div style={{textAlign:"center",padding:"32px 0"}}>
          <div style={{fontSize:64,marginBottom:20}}>📧</div>
          <p style={{color:"var(--text2)",marginBottom:24}}>Check your inbox for the reset link.</p>
          <Btn onClick={()=>navigate("/")} fullWidth>Back to Login</Btn>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} icon="✉"/>
          <Btn onClick={handle} loading={loading} fullWidth size="lg">Send Reset Link</Btn>
          <Link to="/" style={{textAlign:"center",fontSize:14,color:"var(--accent)",textDecoration:"none"}}>Back to Login</Link>
        </div>
      )}
    </AuthLayout>
  );
}

export function VerifyEmail() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [status, setStatus] = useState("verifying");

  useState(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setStatus("error"); return; }
    authAPI.verifyEmail(token)
      .then(()=>{ setStatus("success"); toast.success("Email verified!"); })
      .catch(()=>setStatus("error"));
  });

  return (
    <AuthLayout title={status==="success"?"Email Verified!":status==="error"?"Invalid Link":"Verifying..."} sub={status==="success"?"You can now sign in":status==="error"?"This link is invalid or expired":"Please wait"}>
      <div style={{textAlign:"center",padding:"32px 0"}}>
        <div style={{fontSize:64,marginBottom:24}}>{status==="success"?"✅":status==="error"?"❌":"⏳"}</div>
        {status!=="verifying"&&<Btn onClick={()=>navigate("/")} fullWidth>Go to Login</Btn>}
      </div>
    </AuthLayout>
  );
}
