import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ─────────────────────────────────────────── shared ── */

const LOGO = () => (
  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
    <div style={{ width:30, height:30, borderRadius:6, background:"var(--teal,#18664A)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    </div>
    <div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:"var(--navy,#0B1D33)", lineHeight:1.2 }}>Even Procurement</div>
      <div style={{ fontSize:9, color:"var(--muted,#67788D)", letterSpacing:".08em", textTransform:"uppercase" }}>ESG Sourcing Platform</div>
    </div>
  </div>
);

/* AuthShell — used by ForgotPassword & VerifyEmail */
const AuthShell = ({ children, title, subtitle }) => (
  <div style={{ minHeight:"100vh", background:"var(--cream,#F2EBD9)", display:"flex", flexDirection:"column" }}>
    <nav style={{ height:60, padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border,#D4C9B5)", background:"rgba(242,235,217,.9)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
      <Link to="/home" style={{ textDecoration:"none" }}><LOGO/></Link>
      <Link to="/" style={{ fontSize:13, color:"var(--muted,#67788D)", textDecoration:"none", fontWeight:500 }}>← Back</Link>
    </nav>
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:8, letterSpacing:"-.02em" }}>{title}</h1>
          {subtitle && <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.6 }}>{subtitle}</p>}
        </div>
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"32px 36px", boxShadow:"0 6px 28px rgba(11,29,51,.10)" }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

function FormInput({ label, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:6, letterSpacing:".02em" }}>{label}</label>
      <input {...props}
        onFocus={e=>{ setFocused(true); props.onFocus?.(e); }}
        onBlur={e=>{ setFocused(false); props.onBlur?.(e); }}
        style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:`1.5px solid ${focused?"var(--teal,#18664A)":error?"var(--red,#B84232)":"var(--border,#D4C9B5)"}`, borderRadius:6, outline:"none", transition:"border-color .18s" }}
      />
      {error && <span style={{ fontSize:11, color:"var(--red,#B84232)", marginTop:4, display:"block" }}>{error}</span>}
    </div>
  );
}

function SubmitBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading}
      style={{ width:"100%", padding:"13px 20px", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .18s", opacity:loading?.7:1, marginTop:8 }}
      onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background="var(--teal,#18664A)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background="var(--navy,#0B1D33)"; }}>
      {loading ? <><span className="spinner" style={{width:14,height:14}}/> Please wait…</> : children}
    </button>
  );
}

/* ─────────────────────────────────────── quiz data ── */

const Q0 = {
  badge: "Welcome · Step 1 of 3",
  sub: "Tell us how you'll use Even Procurement",
  text: "I'm here to...",
  twoCol: true,
  opts: [
    { label: "Source from verified,\nESG-scored vendors", desc: "Find impact-first suppliers for my organisation's procurement", value: "buyer", icon: "🔍" },
    { label: "Connect my business\nwith corporate buyers", desc: "I represent a women-led, MSME, cooperative or social enterprise", value: "vendor", icon: "🌱" },
  ]
};

const Q_BUYER = [
  {
    badge: "Buyer · Step 2 of 3",
    sub: "We'll highlight this in your dashboard",
    text: "My biggest procurement challenge right now...",
    opts: [
      { label: "Finding verified, diverse suppliers",       desc: "Hard to discover ESG-scored MSMEs and cooperatives at scale" },
      { label: "BRSR & ESG supply chain compliance",        desc: "Need audit-ready vendor data for BRSR Core FY 2026–27" },
      { label: "Transparent RFP and bid management",        desc: "Managing supplier responses is manual and unstructured" },
      { label: "All of the above",                          desc: "My procurement function needs a full upgrade" },
    ]
  },
  {
    badge: "Buyer · Step 3 of 3",
    sub: "Helps us match the right vendors for you",
    text: "My organisation is...",
    opts: [
      { label: "Corporate or large enterprise" },
      { label: "NGO or development sector" },
      { label: "Government body or PSU" },
      { label: "Startup or growing SME" },
    ]
  },
];

const Q_VENDOR = [
  {
    badge: "Vendor · Step 2 of 3",
    sub: "We'll match you with the right buyers",
    text: "My business is...",
    opts: [
      { label: "Women-led enterprise or cooperative",    desc: "Women-owned business or producer cooperative" },
      { label: "MSME or artisan collective",             desc: "Small or medium enterprise, or artisan group" },
      { label: "Social enterprise or SHG",               desc: "Self-help group or social impact organisation" },
      { label: "Professional services or tech firm",     desc: "IT, consulting, or professional services provider" },
    ]
  },
  {
    badge: "Vendor · Step 3 of 3",
    sub: "Helps buyers discover you faster",
    text: "My primary service area is...",
    opts: [
      { label: "Logistics, Delivery & Warehousing" },
      { label: "Textiles, Apparel & Handicrafts" },
      { label: "IT, Digital & Professional Services" },
      { label: "Food, Healthcare, Facilities & Other" },
    ]
  },
];

const BENEFITS = {
  buyer: [
    "AI-matched ESG-scored vendor recommendations",
    "BRSR-ready supply chain data dashboards",
    "Verified RFP management and bid comparison",
    "Impact reporting across your vendor base",
  ],
  vendor: [
    "Get discovered by verified corporate buyers",
    "Free ESG scoring across 25 criteria (E/S/G)",
    "Certification gap detection & advisory",
    "Direct bid opportunities and deal management",
  ],
};

const TICKER = [
  "10 service categories", "25 ESG scoring criteria", "BRSR-ready marketplace",
  "Women-led vendor focus", "100% KYC-verified", "SDG-tagged sourcing",
  "AI vendor matching", "Real-time bid management",
];

/* ─────────────────────────────────────────── Login ── */

export function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  // phase: 'quiz' | 'signup' | 'login'
  const [phase, setPhase]     = useState('quiz');
  // quiz
  const [step, setStep]       = useState(0);
  const [role, setRole]       = useState(null);
  const [selIdx, setSelIdx]   = useState(null);
  const [cardKey, setCardKey] = useState(0);
  // signup
  const [form, setForm]       = useState({ name:"", email:"", password:"" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  // login
  const [lf, setLf]           = useState({ email:"", password:"" });
  const [le, setLe]           = useState({});
  const [ll, setLl]           = useState(false);
  // resend verification
  const [resendEmail, setResendEmail]   = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent]     = useState(false);

  /* current question */
  const getQ = () => {
    if (step === 0) return Q0;
    return (role === 'buyer' ? Q_BUYER : Q_VENDOR)[step - 1];
  };
  const q = getQ();

  /* pick an option — auto-advance after 550ms */
  const pick = (idx, val) => {
    if (selIdx !== null) return;
    setSelIdx(idx);
    setTimeout(() => {
      if (step === 0) {
        setRole(val);
        setStep(1);
      } else if (step < 2) {
        setStep(s => s + 1);
      } else {
        setPhase('signup');
      }
      setSelIdx(null);
      setCardKey(k => k + 1);
    }, 550);
  };

  const goToLogin = () => setPhase('login');
  const goToQuiz  = () => { setPhase('quiz'); setStep(0); setRole(null); setCardKey(k => k + 1); };

  /* signup submit */
  const handleSignup = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())           errs.name     = "Required";
    if (!form.email.includes("@"))   errs.email    = "Enter a valid email";
    if (form.password.length < 8)    errs.password = "Minimum 8 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password, role });
      setDone(true);
    } catch (err) {
      const d = err.response?.data?.detail;
      const msg = typeof d === "string" ? d : "Registration failed";
      toast.error(msg);
      setErrors({ email: msg });
    } finally { setLoading(false); }
  };

  /* login submit */
  const handleLogin = async e => {
    e.preventDefault();
    const errs = {};
    if (!lf.email)    errs.email    = "Required";
    if (!lf.password) errs.password = "Required";
    if (Object.keys(errs).length) { setLe(errs); return; }
    setLl(true);
    setResendEmail("");
    setResendSent(false);
    try {
      await login(lf.email, lf.password);
      navigate("/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      const msg = typeof d === "string" ? d : "Invalid credentials";
      toast.error(msg);
      if (msg.toLowerCase().includes("verif")) {
        setResendEmail(lf.email);
        setLe({});
      } else {
        setLe({ password: msg });
      }
    } finally { setLl(false); }
  };

  /* resend verification email */
  const handleResend = async (email) => {
    setResendLoading(true);
    try {
      await authAPI.resendVerification(email);
      setResendSent(true);
      toast.success("Verification email resent — check your inbox!");
    } catch {
      toast.error("Could not resend. Try again shortly.");
    } finally { setResendLoading(false); }
  };

  /* ── render ── */
  return (
    <div style={{ minHeight:"100vh", background:"var(--cream,#F2EBD9)", fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:60, padding:"0 5%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(242,235,217,.95)", backdropFilter:"blur(14px)", borderBottom:"1px solid var(--border,#D4C9B5)" }}>
        <LOGO />
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <Link to="/home" style={{ fontSize:13, color:"var(--muted,#67788D)", textDecoration:"none", fontWeight:500 }}>About</Link>
          {phase !== 'login'
            ? <button onClick={goToLogin}
                style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:5, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .2s" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                Sign in
              </button>
            : <button onClick={goToQuiz} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--muted,#67788D)", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                ← New here?
              </button>
          }
        </div>
      </nav>

      <div style={{ height:60 }} />

      {/* ── TICKER STRIP ── */}
      <div style={{ background:"var(--navy,#0B1D33)", overflow:"hidden", padding:"13px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display:"flex", width:"max-content", animation:"scrollStrip 28s linear infinite" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <div key={i} style={{ padding:"0 28px", borderRight:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap", flexShrink:0 }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--teal-2,#22895F)", display:"inline-block", flexShrink:0 }} />
              <span style={{ fontSize:12, color:"rgba(242,235,217,.55)", fontWeight:500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth:680, margin:"0 auto", padding:"56px 24px 80px" }}>

        {/* Page headline */}
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", padding:"5px 12px 5px 7px", borderRadius:99, marginBottom:22 }}>
            <span style={{ width:18, height:18, borderRadius:"50%", background:"var(--teal,#18664A)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M5 1l3 1.75v3.5L5 8 2 6.25V2.75L5 1z" fill="white"/></svg>
            </span>
            India's ESG-first procurement marketplace
          </div>

          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:"-.025em", lineHeight:1.18, marginBottom:14 }}>
            {phase === 'login'
              ? <>Welcome <span style={{ fontStyle:"italic", color:"var(--teal,#18664A)" }}>back.</span></>
              : phase === 'signup'
              ? <>Your dashboard <span style={{ fontStyle:"italic", color:"var(--teal,#18664A)" }}>is ready.</span></>
              : <>Three clicks.<br/><span style={{ fontStyle:"italic", color:"var(--teal,#18664A)" }}>Your personalised platform.</span></>
            }
          </h1>

          {phase === 'quiz' && (
            <p style={{ fontSize:15, color:"var(--muted,#67788D)", lineHeight:1.7, maxWidth:420, margin:"0 auto" }}>
              No typing. Just click what fits — we'll personalise your dashboard before you finish.
            </p>
          )}
          {phase === 'login' && (
            <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7 }}>
              Sign in to your procurement dashboard.
            </p>
          )}
        </div>

        {/* ══ QUIZ ══ */}
        {phase === 'quiz' && (
          <div>
            {/* Progress */}
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ height:4, flex:1, borderRadius:99, transition:"all .4s ease",
                    background: i < step ? "rgba(24,102,74,.35)" : i === step ? "var(--teal,#18664A)" : "var(--cream-dark,#D8CCAF)" }} />
                ))}
              </div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:".05em", textTransform:"uppercase", color:"var(--muted,#67788D)" }}>
                {step === 0 ? "Step 1 of 3" : step === 1 ? "Step 2 of 3" : "Step 3 of 3"}
              </div>
            </div>

            {/* Question card */}
            <div key={cardKey} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding: q.twoCol ? "36px 36px 32px" : "32px 36px", boxShadow:"0 6px 28px rgba(11,29,51,.10)", animation:"fadeUp .35s cubic-bezier(.4,0,.2,1)" }}>

              {/* Card header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:20, flexWrap:"wrap" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", fontSize:10, fontWeight:700, letterSpacing:".09em", textTransform:"uppercase", padding:"4px 10px", borderRadius:99 }}>
                  {q.badge}
                </div>
                <div style={{ fontSize:12, color:"var(--muted,#67788D)", fontStyle:"italic" }}>{q.sub}</div>
              </div>

              {/* Question text */}
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:600, color:"var(--navy,#0B1D33)", lineHeight:1.4, marginBottom:24 }}>
                {q.text}
              </div>

              {/* Options — 2-col for Q0, vertical list for Q1/Q2 */}
              {q.twoCol ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {q.opts.map((opt, i) => (
                    <div key={i} onClick={() => pick(i, opt.value)}
                      style={{ padding:"22px 18px 18px", borderRadius:10, textAlign:"center",
                        border:`1.5px solid ${selIdx===i ? "var(--teal,#18664A)" : "var(--border,#D4C9B5)"}`,
                        background: selIdx===i ? "var(--teal-bg,#E4F2EB)" : "var(--cream,#F2EBD9)",
                        cursor: selIdx!==null ? "default" : "pointer", transition:"all .18s",
                      }}
                      onMouseEnter={e=>{ if(selIdx===null){ e.currentTarget.style.borderColor="var(--teal,#18664A)"; e.currentTarget.style.background="var(--teal-bg,#E4F2EB)"; } }}
                      onMouseLeave={e=>{ if(selIdx!==i){ e.currentTarget.style.borderColor="var(--border,#D4C9B5)"; e.currentTarget.style.background="var(--cream,#F2EBD9)"; } }}>
                      <div style={{ fontSize:26, marginBottom:12 }}>{opt.icon}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", lineHeight:1.4, marginBottom:8, whiteSpace:"pre-line" }}>{opt.label}</div>
                      <div style={{ fontSize:12, color:"var(--muted,#67788D)", lineHeight:1.5 }}>{opt.desc}</div>
                      {selIdx === i && (
                        <div style={{ marginTop:14, display:"flex", justifyContent:"center" }}>
                          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="11" r="10" fill="var(--teal,#18664A)"/>
                            <path d="M6 11l3.5 3.5 6.5-7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {q.opts.map((opt, i) => (
                    <div key={i} onClick={() => pick(i, opt.value || opt.label)}
                      style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"13px 16px", borderRadius:8,
                        border:`1.5px solid ${selIdx===i ? "var(--teal,#18664A)" : "var(--border,#D4C9B5)"}`,
                        background: selIdx===i ? "var(--teal-bg,#E4F2EB)" : "white",
                        cursor: selIdx!==null ? "default" : "pointer", transition:"all .16s",
                      }}
                      onMouseEnter={e=>{ if(selIdx===null){ e.currentTarget.style.borderColor="var(--teal,#18664A)"; e.currentTarget.style.background="var(--teal-bg,#E4F2EB)"; } }}
                      onMouseLeave={e=>{ if(selIdx!==i){ e.currentTarget.style.borderColor="var(--border,#D4C9B5)"; e.currentTarget.style.background="white"; } }}>
                      {/* Letter / tick circle */}
                      <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, marginTop:1,
                        background: selIdx===i ? "var(--teal,#18664A)" : "var(--cream-mid,#E9DFC6)",
                        border:`1.5px solid ${selIdx===i ? "var(--teal,#18664A)" : "var(--border,#D4C9B5)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center", transition:"all .16s" }}>
                        {selIdx === i
                          ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <span style={{ fontSize:11, fontWeight:700, color:"var(--muted,#67788D)" }}>{['A','B','C','D'][i]}</span>
                        }
                      </div>
                      <div style={{ flex:1, paddingTop:2 }}>
                        <div style={{ fontSize:14, lineHeight:1.5, fontWeight: selIdx===i ? 600 : 400, color: selIdx===i ? "var(--navy,#0B1D33)" : "var(--body,#253446)" }}>
                          {opt.label}
                        </div>
                        {opt.desc && (
                          <div style={{ fontSize:12, color:"var(--muted,#67788D)", marginTop:3, lineHeight:1.4 }}>{opt.desc}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SIGNUP ══ */}
        {phase === 'signup' && !done && (
          <div style={{ animation:"fadeUp .4s cubic-bezier(.4,0,.2,1)" }}>

            {/* Benefits panel */}
            <div style={{ background:"var(--navy,#0B1D33)", borderRadius:14, padding:"30px 36px", marginBottom:20, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-50, top:-50, width:200, height:200, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)", pointerEvents:"none" }} />
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:12 }}>
                {role === 'buyer' ? '🔍 Buyer' : '🌱 Vendor'} dashboard — unlocking now
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--cream,#F2EBD9)", lineHeight:1.35, marginBottom:18 }}>
                Here's what you're getting:
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {BENEFITS[role || 'buyer'].map((b, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(24,102,74,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#5FCFA0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:13, color:"rgba(242,235,217,.8)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signup form */}
            <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"32px 36px", boxShadow:"0 6px 28px rgba(11,29,51,.10)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background: role==='buyer' ? "var(--teal-bg,#E4F2EB)" : "var(--amber-bg,#FDF3E4)", color: role==='buyer' ? "var(--teal,#18664A)" : "var(--amber,#B8720A)", fontSize:10, fontWeight:700, letterSpacing:".09em", textTransform:"uppercase", padding:"4px 10px", borderRadius:99, marginBottom:18 }}>
                Joining as {role === 'buyer' ? 'Buyer' : 'Vendor'}
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:22, lineHeight:1.3 }}>
                Create your account
              </div>
              <form onSubmit={handleSignup}>
                <FormInput label="Full name" placeholder="Your name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} error={errors.name} autoComplete="name"/>
                <FormInput label="Work email" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} error={errors.email} autoComplete="email"/>
                <FormInput label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} error={errors.password} autoComplete="new-password"/>
                <SubmitBtn loading={loading}>Create my account →</SubmitBtn>
              </form>
              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--muted,#67788D)" }}>
                Already have an account?{" "}
                <button onClick={goToLogin} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--teal,#18664A)", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Sign in</button>
              </div>
              <div style={{ textAlign:"center", marginTop:8 }}>
                <button onClick={goToQuiz} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted,#67788D)", fontFamily:"'DM Sans',sans-serif", textDecoration:"underline" }}>← Redo quiz</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SIGNUP DONE ══ */}
        {phase === 'signup' && done && (
          <div style={{ animation:"fadeUp .4s cubic-bezier(.4,0,.2,1)" }}>
            <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"52px 40px", boxShadow:"0 6px 28px rgba(11,29,51,.10)", textAlign:"center" }}>
              <div style={{ width:62, height:62, borderRadius:"50%", background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6 12-12" stroke="var(--teal,#18664A)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:10 }}>Check your email</h2>
              <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.75, marginBottom:24 }}>
                We sent a verification link to <strong style={{ color:"var(--navy,#0B1D33)" }}>{form.email}</strong>.<br/>Click it to activate your account and get started.
              </p>
              <button onClick={goToLogin}
                style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"13px 30px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .2s", marginBottom:16 }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                Go to sign in →
              </button>
              <div style={{ fontSize:13, color:"var(--muted,#67788D)" }}>
                {resendSent
                  ? <span style={{ color:"var(--teal,#18664A)", fontWeight:600 }}>✓ Email resent — check your inbox</span>
                  : <>Didn't get it?{" "}
                      <button onClick={()=>handleResend(form.email)} disabled={resendLoading}
                        style={{ background:"none", border:"none", cursor:resendLoading?"not-allowed":"pointer", color:"var(--teal,#18664A)", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:0 }}>
                        {resendLoading ? "Sending…" : "Resend verification email"}
                      </button>
                    </>
                }
              </div>
            </div>
          </div>
        )}

        {/* ══ LOGIN ══ */}
        {phase === 'login' && (
          <div style={{ animation:"fadeUp .35s cubic-bezier(.4,0,.2,1)" }}>
            <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"36px 40px", boxShadow:"0 6px 28px rgba(11,29,51,.10)" }}>
              <form onSubmit={handleLogin}>
                <FormInput label="Work email" type="email" placeholder="you@company.com" value={lf.email} onChange={e=>setLf(p=>({...p,email:e.target.value}))} error={le.email} autoComplete="email"/>
                <FormInput label="Password" type="password" placeholder="Your password" value={lf.password} onChange={e=>setLf(p=>({...p,password:e.target.value}))} error={le.password} autoComplete="current-password"/>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8, marginTop:-8 }}>
                  <Link to="/forgot-password" style={{ fontSize:12, color:"var(--teal,#18664A)", textDecoration:"none" }}>Forgot password?</Link>
                </div>
                {resendEmail && (
                  <div style={{ background:"var(--amber-bg,#FDF3E4)", border:"1px solid rgba(184,114,10,.2)", borderRadius:8, padding:"12px 14px", marginBottom:14, fontSize:13, color:"var(--body,#253446)", lineHeight:1.5 }}>
                    <strong style={{ color:"var(--amber,#B8720A)" }}>Email not verified.</strong> Check your inbox for the link.
                    <div style={{ marginTop:6 }}>
                      {resendSent
                        ? <span style={{ color:"var(--teal,#18664A)", fontWeight:600, fontSize:12 }}>✓ Email resent — check your inbox</span>
                        : <button type="button" onClick={()=>handleResend(resendEmail)} disabled={resendLoading}
                            style={{ background:"none", border:"none", cursor:resendLoading?"not-allowed":"pointer", color:"var(--teal,#18664A)", fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif", padding:0, textDecoration:"underline" }}>
                            {resendLoading ? "Sending…" : "Resend verification email →"}
                          </button>
                      }
                    </div>
                  </div>
                )}
                <SubmitBtn loading={ll}>Sign in →</SubmitBtn>
              </form>
              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--muted,#67788D)" }}>
                New here?{" "}
                <button onClick={goToQuiz} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--teal,#18664A)", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                  Take the quick quiz →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop:"1px solid var(--border,#D4C9B5)", padding:"20px 5%", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:12, color:"var(--muted,#67788D)" }}>© 2026 Even Procurement · India's ESG-first procurement marketplace</div>
        <div style={{ display:"flex", gap:20 }}>
          <Link to="/home"  style={{ fontSize:12, color:"var(--muted,#67788D)", textDecoration:"none" }}>Platform overview</Link>
          <a href="mailto:even.procurement@evencargo.com" style={{ fontSize:12, color:"var(--muted,#67788D)", textDecoration:"none" }}>Contact</a>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────── Register ── */

export function Register() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [form, setForm]     = useState({ name:"", email:"", password:"", confirm:"", role:"vendor" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handle = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())                errs.name    = "Required";
    if (!form.email.includes("@"))        errs.email   = "Enter a valid email";
    if (form.password.length < 8)         errs.password = "Minimum 8 characters";
    if (form.password !== form.confirm)   errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password, role: form.role });
      setDone(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d=>d.msg).join(", ") : typeof detail==="string" ? detail : "Registration failed";
      toast.error(msg);
      setErrors({ email: msg });
    } finally { setLoading(false); }
  };

  if (done) return (
    <AuthShell title="Check your email">
      <div style={{ textAlign:"center", padding:"8px 0" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:24 }}>✓</div>
        <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:24 }}>We sent a verification link to <strong style={{ color:"var(--navy,#0B1D33)" }}>{form.email}</strong>. Click it to activate your account.</p>
        <button onClick={()=>navigate("/")} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Go to login →</button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell title="Create your account" subtitle="Join India's ESG-first procurement platform">
      <form onSubmit={handle}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:8, letterSpacing:".02em" }}>I am joining as</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{ val:"vendor", label:"Vendor", desc:"Supply goods & services", icon:"🌱" }, { val:"buyer", label:"Buyer", desc:"Source from impact vendors", icon:"🔍" }].map(r => (
              <button key={r.val} type="button" onClick={()=>setForm(p=>({...p,role:r.val}))}
                style={{ padding:"14px 12px", borderRadius:8, textAlign:"center", cursor:"pointer", border:`2px solid ${form.role===r.val?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:form.role===r.val?"var(--teal-bg,#E4F2EB)":"var(--cream,#F2EBD9)", transition:"all .15s" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{r.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:2 }}>{r.label}</div>
                <div style={{ fontSize:11, color:"var(--muted,#67788D)" }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <FormInput label="Full name" placeholder="Your name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} error={errors.name} autoComplete="name"/>
        <FormInput label="Work email" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} error={errors.email} autoComplete="email"/>
        <FormInput label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} error={errors.password} autoComplete="new-password"/>
        <FormInput label="Confirm password" type="password" placeholder="Same as above" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))} error={errors.confirm} autoComplete="new-password"/>
        <SubmitBtn loading={loading}>Create account →</SubmitBtn>
        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--muted,#67788D)" }}>
          Already registered? <Link to="/" style={{ color:"var(--teal,#18664A)", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}

/* ─────────────────────────────────── ForgotPassword ── */

export function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try { await authAPI.forgotPassword(email); setSent(true); }
    catch { toast.error("Something went wrong. Check the email address."); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <AuthShell title="Email sent">
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:16 }}>📬</div>
        <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:24 }}>We sent a reset link to <strong style={{ color:"var(--navy,#0B1D33)" }}>{email}</strong>. Check your inbox.</p>
        <button onClick={()=>navigate("/")} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Back to login</button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to reset your password">
      <form onSubmit={handle}>
        <FormInput label="Work email" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        <SubmitBtn loading={loading}>Send reset link →</SubmitBtn>
        <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:"var(--muted,#67788D)" }}>
          <Link to="/" style={{ color:"var(--teal,#18664A)", fontWeight:600, textDecoration:"none" }}>← Back to login</Link>
        </div>
      </form>
    </AuthShell>
  );
}

/* ──────────────────────────────────── VerifyEmail ── */

export function VerifyEmail() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    authAPI.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  const map = {
    verifying: { icon:"⏳", title:"Verifying your email…",   body:"Just a moment.",                                              btn:null },
    success:   { icon:"✅", title:"Email verified!",          body:"Your account is active. You can now sign in.",              btn:"Go to login" },
    error:     { icon:"❌", title:"Link expired or invalid",  body:"Please request a new verification email.",                  btn:"Back to login" },
  };
  const s = map[status];

  return (
    <AuthShell title={s.title}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>{s.icon}</div>
        <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:s.btn?24:0 }}>{s.body}</p>
        {s.btn && <button onClick={()=>navigate("/")} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s.btn}</button>}
      </div>
    </AuthShell>
  );
}
