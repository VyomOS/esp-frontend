import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { vendorAPI, buyerAPI, bidAPI, chatAPI, notificationAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Btn, Input, Textarea, Select, Modal, Empty } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import SectorIcon, { sectorIconKey } from "../components/SectorIcon";
import { useLocation, useNavigate } from "react-router-dom";

/* ─────────────────────────────────── constants ── */
const SERVICE_CATEGORIES = [
  "Logistics & Delivery","Facilities & Cleaning","Staffing & Training",
  "Food & Catering","Textiles & Apparel","IT & Digital Services",
  "Green & Sustainability","Handicrafts & Artisan","Healthcare & Wellness","Construction & Fitout",
];
const CAT_ICONS = {
  "Logistics & Delivery":"🚚","Facilities & Cleaning":"🏢","Staffing & Training":"👥",
  "Food & Catering":"🍽️","Textiles & Apparel":"👗","IT & Digital Services":"💻",
  "Green & Sustainability":"🌿","Handicrafts & Artisan":"🪴","Healthcare & Wellness":"🏥",
  "Construction & Fitout":"🏗️",
};
const CERT_TYPES  = ["women_led","msme_udyam","sc_st_owned","shg","social_enterprise","cooperative","fair_trade","weps_signatory"];
const SDG_TAGS    = ["SDG1","SDG2","SDG3","SDG4","SDG5","SDG6","SDG7","SDG8","SDG9","SDG10","SDG11","SDG12","SDG13","SDG14","SDG15","SDG16","SDG17"];
const TEAM_SIZES  = ["1–10","11–50","51–200","200+"];
const TURNOVER    = ["Less than ₹10L","₹10L – ₹1Cr","₹1Cr – ₹10Cr","₹10Cr+"];
const TURNOVER_V  = ["<10L","10L-1Cr","1Cr-10Cr","10Cr+"];

/* ─────────────────────────────────── helpers ── */
function fixNotifLink(link, category) {
  // Backend sends internal paths that may differ from frontend routes
  const map = {
    "/dashboard/my-bids":     "/dashboard/opportunities",
    "/dashboard/my-requests": "/dashboard/requests",
    "/dashboard/documents":   "/dashboard/profile",
  };
  const resolved = link ? (map[link] || link) : null;
  if (resolved) return resolved;
  if (category === "bid")     return "/dashboard/opportunities";
  if (category === "profile") return "/dashboard/profile";
  return null;
}

function parseJSON(val, fallback = []) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return fallback; }
}
function toJSON(arr) { return JSON.stringify(arr); }
const userName = () => localStorage.getItem("name") || "there";
const fmt = v => v || <span style={{ color:"var(--muted,#67788D)", fontStyle:"italic" }}>Not added</span>;
const looksLikeGSTIN = v => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test((v||"").trim().toUpperCase());
const looksLikePAN = v => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test((v||"").trim().toUpperCase());
function mergePrefillIntoForm(current, prefill = {}) {
  const next = { ...current };
  ["organization_name","location","category","gstin","pan","cin","team_size_band","annual_turnover_band","year_founded"].forEach(field => {
    if (prefill[field] !== undefined && prefill[field] !== null && prefill[field] !== "") next[field] = String(prefill[field]);
  });
  if (Array.isArray(prefill.certification_types)) {
    const existing = parseJSON(current.certification_types);
    next.certification_types = toJSON([...new Set([...existing, ...prefill.certification_types])]);
  }
  return next;
}

/* ─────────────────────────────────── Gauge ── */
function ProfileGauge({ score }) {
  const pct   = Math.min(Math.max(score, 0), 100);
  const angle = -90 + (pct / 100) * 180;
  // Light colours — visible on the dark navy card background
  const color = pct >= 70 ? "#5FCFA0" : pct >= 40 ? "#F5B342" : "#F5937F";
  const label = pct >= 70 ? "Strong profile" : pct >= 40 ? "Building up" : "Just getting started";
  return (
    <div style={{ textAlign:"center" }}>
      {/* viewBox matches the reference dashboard exactly */}
      <svg viewBox="0 0 200 120" width="200" height="120"
        style={{ display:"block", margin:"0 auto", overflow:"visible" }}>
        {/* Background track */}
        <path d="M15 110 A85 85 0 0 1 185 110"
          stroke="rgba(255,255,255,0.12)" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* Coloured zones — light enough to read on navy */}
        <path d="M15 110 A85 85 0 0 1 65 28"
          stroke="#F5937F" strokeWidth="12" strokeLinecap="round" fill="none" opacity=".55"/>
        <path d="M65 28 A85 85 0 0 1 135 28"
          stroke="#F5B342" strokeWidth="12" fill="none" opacity=".55"/>
        <path d="M135 28 A85 85 0 0 1 185 110"
          stroke="#5FCFA0" strokeWidth="12" strokeLinecap="round" fill="none" opacity=".55"/>
        {/* Needle — wrapped in <g> so rotation works reliably across browsers */}
        <g style={{ transformOrigin:"100px 110px", transform:`rotate(${angle}deg)`, transition:"transform 1.3s cubic-bezier(.4,0,.2,1)" }}>
          <line x1="100" y1="110" x2="100" y2="34"
            stroke={color} strokeWidth="3" strokeLinecap="round"/>
        </g>
        <circle cx="100" cy="110" r="7" fill={color}/>
        <circle cx="100" cy="110" r="3.5" fill="white"/>
        {/* Zone labels */}
        <text x="8"   y="122" fontFamily="DM Sans,sans-serif" fontSize="9" fill="rgba(242,235,217,.4)">0</text>
        <text x="92"  y="22"  fontFamily="DM Sans,sans-serif" fontSize="9" fill="rgba(242,235,217,.4)">50</text>
        <text x="182" y="122" fontFamily="DM Sans,sans-serif" fontSize="9" fill="rgba(242,235,217,.4)">100</text>
      </svg>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:700, color, lineHeight:1, marginTop:4 }}>{pct}</div>
      <div style={{ fontSize:11, color:"rgba(242,235,217,.5)", textTransform:"uppercase", letterSpacing:".07em", marginTop:6 }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────── AI suggestion engine ── */
function buildRawSuggestions(profile, completeness, esgResult) {
  const cats = parseJSON(profile?.service_categories);
  const tips  = completeness?.tips || [];
  const suggs = [];

  if (!profile?.description)
    suggs.push({ id:"desc", icon:"📝", title:"Tell buyers what you do",
      fallback:`Buyers searching for ${cats[0] || "vendors"} skip profiles with no description. Adding one takes 2 minutes.`,
      prompt:`Write a 20-word compelling reason for a ${cats[0]||"services"} business named "${profile?.organization_name||"this business"}" to add their profile description. Focus on buyer benefit.`,
      action:"Add description", actionTab:"profile", actionSection:"basics" });

  if (!esgResult || !esgResult.score)
    suggs.push({ id:"esg", icon:"🌱", title:"Get your ESG score",
      fallback:"ESG-scored vendors appear in 5× more buyer searches. Complete the 3-part assessment in under 10 minutes.",
      prompt:"Write a 20-word reason for a small Indian vendor to complete an ESG assessment. Mention business benefit. Be specific.",
      action:"Start ESG assessment", actionTab:"esg" });

  if (!profile?.gstin_verified)
    suggs.push({ id:"gst", icon:"✅", title:"Verify your GST number",
      fallback:"Verified vendors build buyer trust instantly. Your GST verification takes 30 seconds.",
      prompt:"Write a 20-word tip for a vendor to verify their GST number for business credibility. Short and direct.",
      action:"Verify now", actionTab:"profile", actionSection:"verification" });

  if (tips.length > 0 && suggs.length < 2)
    suggs.push({ id:"tip0", icon:"💡", title:tips[0],
      fallback:tips[0],
      prompt:`Rephrase this profile tip as a compelling 20-word action message: "${tips[0]}"`,
      action:"Update profile", actionTab:"profile" });

  return suggs.slice(0, 3);
}

/* ─────────────────────────────────── Onboarding wizard ── */
function OnboardingWizard({ onComplete, onSkip }) {
  const toast    = useToast();
  const [step, setStep]       = useState(0);
  const [cats, setCats]       = useState([]);
  const [womenLed, setWomenLed] = useState(null);
  const [form, setForm]       = useState({ organization_name:"", location:"", description:"", team_size_band:"" });
  const [saving, setSaving]   = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [smartInput, setSmartInput] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [majorCustomersText, setMajorCustomersText] = useState("");

  const toggleCat = c => setCats(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev,c]);

  const generateDesc = async () => {
    if (!form.organization_name && cats.length === 0) { toast.error("Add your org name and category first"); return; }
    setGenLoading(true);
    try {
      const r = await vendorAPI.aiDescription({
        kind: "business",
        context: { org_name: form.organization_name, location: form.location, category: cats[0] || "" },
      });
      setForm(p => ({ ...p, description: r.data.text || "" }));
    } catch { toast.error("AI unavailable — write it yourself!"); }
    finally { setGenLoading(false); }
  };

  const smartPrefill = async () => {
    const value = smartInput.trim() || form.organization_name.trim();
    if (!value) { toast.error("Enter company name, GSTIN or PAN"); return; }
    setSmartLoading(true);
    try {
      const payload = { consent:true };
      if (looksLikeGSTIN(value)) payload.gstin = value.toUpperCase();
      else if (looksLikePAN(value)) payload.pan = value.toUpperCase();
      else payload.company_name = value;
      const r = await vendorAPI.smartPrefill(payload);
      const prefill = r.data.prefill || {};
      setForm(p=>mergePrefillIntoForm(p, prefill));
      if (prefill.organization_name) setSmartInput(prefill.organization_name);
      if (Array.isArray(prefill.certification_types) && prefill.certification_types.includes("msme_udyam")) {
        setCats(prev => prev.length ? prev : []);
      }
      toast.success(r.data.provider === "stub" ? "Saved in demo mode. Add Surepass token for live registry data." : "Business details fetched.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not fetch business details");
    } finally {
      setSmartLoading(false);
    }
  };

  const save = async () => {
    if (!form.organization_name.trim()) { toast.error("Enter your organisation name"); return; }
    setSaving(true);
    const payload = {
      organization_name: form.organization_name,
      location: form.location,
      description: form.description,
      team_size_band: form.team_size_band,
      gstin: form.gstin,
      pan: form.pan,
      cin: form.cin,
      service_categories: toJSON(cats),
      is_women_owned: womenLed === true,
      certification_types: toJSON([]),
      sdg_tags: toJSON([]),
    };
    try {
      try {
        await vendorAPI.createProfile(payload);
      } catch (createErr) {
        // Profile already exists (400) — update instead
        if (createErr.response?.status === 400) {
          await vendorAPI.updateProfile(payload);
        } else { throw createErr; }
      }
      toast.success("Profile created! Welcome aboard.");
      onComplete();
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Save failed");
    } finally { setSaving(false); }
  };

  const next = () => { setStep(s=>s+1); setCardKey(k=>k+1); };

  const s = { fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"var(--cream,#F2EBD9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px" };

  return (
    <div style={s}>
      {/* Progress */}
      <div style={{ width:"100%", maxWidth:580, marginBottom:28 }}>
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {[0,1].map(i=>(
            <div key={i} style={{ height:4, flex:1, borderRadius:99, background: i<step?"rgba(24,102,74,.35)": i===step?"var(--teal,#18664A)":"var(--cream-dark,#D8CCAF)", transition:"all .4s" }}/>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:"var(--muted,#67788D)" }}>{step===0?"Step 1 of 2":"Step 2 of 2"}</div>
      </div>

      <div key={cardKey} style={{ width:"100%", maxWidth:580, background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:16, padding:"36px 40px", boxShadow:"0 8px 40px rgba(11,29,51,.10)", animation:"fadeUp .35s cubic-bezier(.4,0,.2,1)" }}>

        {step === 0 && (<>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal,#18664A)", marginBottom:14 }}>Welcome · Step 1</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:6 }}>Your business, in 30 seconds</div>
          <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:24 }}>No walls of forms. Just a few clicks to get you discovered by buyers.</p>

          {/* Smart company lookup */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", display:"block", marginBottom:6 }}>Company name, GSTIN or PAN *</label>
            <div style={{ display:"flex", gap:8 }}>
              <input value={smartInput} onChange={e=>{ setSmartInput(e.target.value); setForm(p=>({...p,organization_name:e.target.value})); }} placeholder="Start with company name, GSTIN or PAN"
                style={{ flex:1, minWidth:0, padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
              <button onClick={smartPrefill} disabled={smartLoading}
                style={{ padding:"0 14px", background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, fontSize:13, fontWeight:700, cursor:smartLoading?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                {smartLoading ? "Fetching..." : "Auto-fill"}
              </button>
            </div>
            <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:6 }}>We use registry data only with your consent and mark fetched fields separately from self-declared answers.</div>
            {form.organization_name && form.organization_name !== smartInput && (
              <div style={{ marginTop:8, fontSize:12, color:"var(--teal,#18664A)", fontWeight:700 }}>Selected: {form.organization_name}</div>
            )}
          </div>

          {/* Service categories */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>What do you offer? (pick all that apply)</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {SERVICE_CATEGORIES.map(c=>{
                const sel = cats.includes(c);
                return (
                  <div key={c} onClick={()=>toggleCat(c)} style={{ padding:"12px 14px", borderRadius:8, border:`1.5px solid ${sel?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:sel?"var(--teal-bg,#E4F2EB)":"white", cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all .16s" }}>
                    <span style={{ fontSize:18 }}>{CAT_ICONS[c]}</span>
                    <span style={{ fontSize:13, fontWeight:sel?600:400, color:sel?"var(--teal,#18664A)":"var(--body,#253446)" }}>{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Women-led */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>Is this a women-led business?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:true,label:"Yes — women-led",desc:"Women-owned or led enterprise",icon:"✊"},{v:false,label:"Not currently",desc:"Still eligible for the platform",icon:"🤝"}].map(opt=>(
                <div key={String(opt.v)} onClick={()=>setWomenLed(opt.v)} style={{ padding:"16px 14px", borderRadius:10, border:`1.5px solid ${womenLed===opt.v?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:womenLed===opt.v?"var(--teal-bg,#E4F2EB)":"var(--cream,#F2EBD9)", cursor:"pointer", textAlign:"center", transition:"all .18s" }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{opt.icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--navy,#0B1D33)" }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:3 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={()=>{ if(!form.organization_name.trim()){ toast.error("Enter your org name"); return; } if(cats.length===0){ toast.error("Pick at least one category"); return; } next(); }}
            style={{ width:"100%", padding:"13px", background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
            Continue →
          </button>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <button onClick={onSkip} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted,#67788D)", fontFamily:"'DM Sans',sans-serif" }}>Skip setup, go to dashboard</button>
          </div>
        </>)}

        {step === 1 && (<>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal,#18664A)", marginBottom:14 }}>Almost there · Step 2</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:6 }}>Tell buyers about you</div>
          <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:24 }}>This is what buyers read first. AI can write it for you.</p>

          {/* Location */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", display:"block", marginBottom:6 }}>Location</label>
            <input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="City, State (e.g. Mumbai, Maharashtra)"
              style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
          </div>

          {/* Description + AI */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)" }}>Business description</label>
              <button onClick={generateDesc} disabled={genLoading} style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, cursor:genLoading?"wait":"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
                {genLoading ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Generating…</> : <>✨ Generate with AI</>}
              </button>
            </div>
            <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={4}
              placeholder="Describe what your business does and who you serve..."
              style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", resize:"vertical", lineHeight:1.6 }}/>
          </div>

          {/* Team size */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>Team size</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TEAM_SIZES.map(s=>(
                <div key={s} onClick={()=>setForm(p=>({...p,team_size_band:s}))}
                  style={{ padding:"9px 18px", borderRadius:8, border:`1.5px solid ${form.team_size_band===s?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:form.team_size_band===s?"var(--teal-bg,#E4F2EB)":"white", cursor:"pointer", fontSize:13, fontWeight:form.team_size_band===s?600:400, color:form.team_size_band===s?"var(--teal,#18664A)":"var(--body,#253446)", transition:"all .16s" }}>
                  {s} people
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            style={{ width:"100%", padding:"13px", background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, fontSize:14, fontWeight:600, cursor:saving?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--teal-2,#22895F)"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--teal,#18664A)"}>
            {saving ? <><span className="spinner" style={{width:14,height:14}}/> Saving…</> : "Enter my dashboard →"}
          </button>
          <div style={{ textAlign:"center", marginTop:10 }}>
            <button onClick={()=>{setStep(0);setCardKey(k=>k+1);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted,#67788D)", fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Main dashboard ── */
export default function VendorDashboard() {
  const location = useNavigate();
  const nav      = useNavigate();
  const loc      = useLocation();
  const toast    = useToast();

  const tab = loc.pathname.includes("profile")      ? "profile"
    : loc.pathname.includes("services")             ? "services"
    : loc.pathname.includes("opportunities")        ? "opportunities"
    : loc.pathname.includes("esg")                  ? "esg"
    : "home";

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(()=>{
    vendorAPI.getMyProfile()
      .then(p => {
        if (p.data?.organization_name) {
          // Profile already exists — skip onboarding regardless of localStorage state
          localStorage.setItem("onboarding_done","1");
          setOnboardingChecked(true);
        } else {
          setShowOnboarding(true);
        }
      })
      .catch(() => setShowOnboarding(true)); // 404 = no profile yet → show wizard
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_done","1");
    setShowOnboarding(false);
    setOnboardingChecked(true);
  };
  const handleOnboardingSkip = () => {
    localStorage.setItem("onboarding_done","1");
    setShowOnboarding(false);
    setOnboardingChecked(true);
  };

  if (showOnboarding) return <OnboardingWizard onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip}/>;
  if (!onboardingChecked) return null;

  return (
    <Layout>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"1.5px solid var(--border)", marginBottom:28, flexWrap:"wrap" }}>
        {[
          { id:"home",          label:"Home",         icon:"⬡" },
          { id:"profile",       label:"Profile",      icon:"◈" },
          { id:"services",      label:"Services",     icon:"◇" },
          { id:"opportunities", label:"Opportunities",icon:"📋" },
          { id:"esg",           label:"ESG",          icon:"🌱" },
        ].map(t=>{
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={()=>nav(t.id==="home"?"/dashboard":`/dashboard/${t.id}`)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, letterSpacing:".01em", color:active?"var(--navy,#0B1D33)":"var(--text3,#67788D)", borderBottom:`2px solid ${active?"var(--teal,#18664A)":"transparent"}`, marginBottom:"-1.5px", transition:"all .16s" }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      {tab === "home"          && <VendorHome toast={toast} nav={nav}/>}
      {tab === "profile"       && <VendorProfile toast={toast}/>}
      {tab === "services"      && <VendorServices toast={toast}/>}
      {tab === "opportunities" && <VendorOpportunities toast={toast}/>}
      {tab === "esg"           && <VendorESG toast={toast}/>}
    </Layout>
  );
}

/* ─────────────────────────────────── HOME tab ── */
function VendorHome({ toast, nav }) {
  const [profile, setProfile]       = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [esgResult, setEsgResult]   = useState(null);
  const [allRFPs, setAllRFPs]       = useState([]);
  const [bids, setBids]             = useState([]);
  const [suggs, setSuggs]           = useState([]);
  const [notifs, setNotifs]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [bidModal, setBidModal]     = useState(null);

  useEffect(()=>{
    Promise.allSettled([
      vendorAPI.getMyProfile(), vendorAPI.completeness(),
      vendorAPI.esgCompliance(), buyerAPI.listRequests(),
      bidAPI.myBids(), notificationAPI.getAll({ unread_only: true, limit: 3 }),
    ]).then(([p,c,e,r,b,n])=>{
      const prof = p.status==="fulfilled" ? p.value.data : null;
      const comp = c.status==="fulfilled" ? c.value.data : null;
      const esg  = e.status==="fulfilled" ? e.value.data : null;
      setProfile(prof); setCompleteness(comp); setEsgResult(esg);
      if (r.status==="fulfilled") setAllRFPs(r.value.data);
      if (b.status==="fulfilled") setBids(b.value.data);
      if (n.status==="fulfilled") setNotifs((n.value.data.notifications || n.value.data || []).slice(0,3));

      // Fetch AI suggestions from dedicated endpoint
      if (prof || comp || esg) {
        vendorAPI.aiProfileAdvice({
          profile: prof,
          completeness_score: comp?.score || 0,
          esg_result: esg,
        }).then(res => {
          setSuggs(res.data.suggestions || []);
        }).catch(() => {
          // Fallback: build rule-based suggestions
          setSuggs(buildRawSuggestions(prof, comp, esg));
        });
      }
    }).finally(()=>setLoading(false));
  },[]);

  // Filter RFPs that match vendor's service categories
  const vendorCats = parseJSON(profile?.service_categories);
  const matchedRFPs = allRFPs.filter(r => {
    if (!r.category) return false;
    return vendorCats.some(c => c.toLowerCase().includes(r.category.toLowerCase().split("&")[0].trim()) ||
      r.category.toLowerCase().includes(c.toLowerCase().split("&")[0].trim()));
  }).slice(0, 4);

  const recentBids = bids.slice(0, 3);
  const score = completeness?.score || 0;

  const bidStatusColor = { submitted:"var(--teal)", under_review:"var(--amber,#B8720A)", shortlisted:"#6384ff", awarded:"var(--teal,#18664A)", declined:"var(--red,#B84232)" };
  const bidStatusIcon  = { submitted:"📨", under_review:"👀", shortlisted:"⭐", awarded:"🏆", declined:"✗" };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:90, borderRadius:12}}/>)}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, animation:"fadeUp .4s ease" }}>

      {/* ── Hero: greeting + gauge ── */}
      <div style={{ background:"var(--navy,#0B1D33)", borderRadius:16, padding:"32px 36px", display:"grid", gridTemplateColumns:"1fr auto", gap:32, alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-60, top:-60, width:240, height:240, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:10 }}>Vendor dashboard</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:700, color:"var(--cream,#F2EBD9)", lineHeight:1.25, margin:0 }}>
              Good {new Date().getHours()<12?"morning":"afternoon"}, {userName().split(" ")[0]}.
            </h1>
            {/* Verification badge next to name */}
            {profile?.verification_status === "verified"
              ? <span title="Platform verified" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(95,207,160,.18)", border:"1px solid rgba(95,207,160,.35)", color:"#5FCFA0", fontSize:11, fontWeight:700, padding:"3px 10px 3px 6px", borderRadius:99, flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#5FCFA0"/>
                    <path d="M3.5 7l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Verified
                </span>
              : profile?.verification_status === "rejected"
              ? <span title="Profile rejected — re-upload documents" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(245,147,127,.18)", border:"1px solid rgba(245,147,127,.35)", color:"#F5937F", fontSize:11, fontWeight:700, padding:"3px 10px 3px 6px", borderRadius:99, flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#F5937F"/>
                    <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Action needed
                </span>
              : <span title="Verification pending admin review" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(245,179,66,.18)", border:"1px solid rgba(245,179,66,.35)", color:"#F5B342", fontSize:11, fontWeight:700, padding:"3px 10px 3px 6px", borderRadius:99, flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#F5B342"/>
                    <path d="M7 4v3.5l2 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Pending review
                </span>
            }
          </div>
          <p style={{ fontSize:13, color:"rgba(242,235,217,.55)", lineHeight:1.6, marginBottom:20, maxWidth:400 }}>
            {score < 40 ? "Your profile is still new — complete it to start getting discovered by buyers."
              : score < 70 ? "You're building up. A few more steps and buyers will find you easily."
              : "Your profile is strong. Browse opportunities and submit bids below."}
          </p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {esgResult?.score > 0 && (
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:"var(--cream,#F2EBD9)", fontFamily:"'Playfair Display',serif" }}>{esgResult.score}<span style={{ fontSize:12, color:"rgba(242,235,217,.4)", fontFamily:"'DM Sans',sans-serif" }}>/100</span></div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)", textTransform:"uppercase", letterSpacing:".07em" }}>ESG Score</div>
              </div>
            )}
            {bids.length > 0 && (
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:"var(--cream,#F2EBD9)", fontFamily:"'Playfair Display',serif" }}>{bids.length}</div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)", textTransform:"uppercase", letterSpacing:".07em" }}>Bids submitted</div>
              </div>
            )}
            {matchedRFPs.length > 0 && (
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:"#5FCFA0", fontFamily:"'Playfair Display',serif" }}>{matchedRFPs.length}</div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)", textTransform:"uppercase", letterSpacing:".07em" }}>Matching RFPs</div>
              </div>
            )}
          </div>
        </div>
        {/* Gauge */}
        <div style={{ background:"rgba(255,255,255,.04)", borderRadius:14, padding:"20px 24px", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(242,235,217,.4)", marginBottom:8 }}>Profile completion</div>
          <ProfileGauge score={score}/>
        </div>
      </div>

      {/* ── Verification status card ── */}
      {(() => {
        const vs = profile?.verification_status;
        const checklist = completeness?.checklist || [];
        const docUploaded  = checklist.find(c=>c.item==="At least 1 document uploaded")?.done;
        const docVerified  = checklist.find(c=>c.item==="Document verified by admin")?.done;
        const esgDone      = checklist.find(c=>c.item==="ESG metrics submitted")?.done;
        const fullyDone    = vs==="verified" && profile?.gstin_verified && profile?.pan_verified && docVerified && esgDone;

        const checks = [
          { label:"Platform verification", done: vs==="verified", rejected: vs==="rejected", pending: vs==="pending", info: vs==="verified"?"Admin approved your profile": vs==="rejected"?"Re-upload your documents":"Waiting for admin review" },
          { label:"GST number",    done: !!profile?.gstin_verified, info: profile?.gstin_verified?"GSTIN verified":"Verify your GST number in Profile → Verification" },
          { label:"PAN card",      done: !!profile?.pan_verified,   info: profile?.pan_verified?"PAN verified":"Verify your PAN card in Profile → Verification" },
          { label:"KYC document",  done: !!docUploaded,             info: docUploaded?(docVerified?"Document verified by admin":"Document uploaded — pending admin review"):"Upload a KYC document in Profile → Documents" },
          { label:"ESG assessment",done: !!esgDone,                 info: esgDone?"ESG score submitted":"Complete the ESG assessment to unlock more opportunities" },
        ];

        return (
          <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>
            {/* Card header */}
            <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--border,#D4C9B5)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15 }}>{fullyDone?"🏅":"🔐"}</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>
                  {fullyDone ? "Profile fully verified" : "Verification status"}
                </span>
              </div>
              <button onClick={()=>nav("/dashboard/profile")}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif" }}>
                Manage →
              </button>
            </div>

            {fullyDone && (
              <div style={{ padding:"14px 22px", background:"var(--teal-bg,#E4F2EB)", fontSize:13, color:"var(--teal,#18664A)", fontWeight:500 }}>
                🎉 Congratulations — your profile is fully verified. Buyers can see and trust your listing.
              </div>
            )}

            {/* Check rows */}
            <div style={{ padding:"6px 0" }}>
              {checks.map((c,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 22px", borderBottom: i<checks.length-1?"1px solid var(--border,#D4C9B5)":"none" }}>
                  {/* Status icon */}
                  <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                    background: c.done ? "var(--teal-bg,#E4F2EB)" : c.rejected ? "var(--red-bg,#FAEBE8)" : "var(--amber-bg,#FDF3E4)" }}>
                    {c.done
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-6" stroke="var(--teal,#18664A)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : c.rejected
                      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="var(--red,#B84232)" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="var(--amber,#B8720A)" strokeWidth="1.2"/><path d="M5 3v2.5l1.5 1" stroke="var(--amber,#B8720A)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    }
                  </div>
                  {/* Label + info */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--navy,#0B1D33)" }}>{c.label}</div>
                    <div style={{ fontSize:11, color: c.done?"var(--teal,#18664A)": c.rejected?"var(--red,#B84232)":"var(--amber,#B8720A)", marginTop:1 }}>{c.info}</div>
                  </div>
                  {/* Status chip */}
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", padding:"3px 9px", borderRadius:99, flexShrink:0,
                    background: c.done?"var(--teal-bg,#E4F2EB)": c.rejected?"var(--red-bg,#FAEBE8)":"var(--amber-bg,#FDF3E4)",
                    color: c.done?"var(--teal,#18664A)": c.rejected?"var(--red,#B84232)":"var(--amber,#B8720A)" }}>
                    {c.done ? "Verified" : c.rejected ? "Rejected" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            {!fullyDone && (
              <div style={{ padding:"14px 22px", borderTop:"1px solid var(--border,#D4C9B5)", background:"var(--cream,#F2EBD9)" }}>
                <button onClick={()=>nav("/dashboard/profile")}
                  style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .18s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                  Complete your verification →
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── AI suggestions ── */}
      {suggs.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Recommended next steps</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {suggs.map(s=>(
              <div key={s.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 2px 12px rgba(11,29,51,.06)" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55 }}>{s.body}</div>
                </div>
                <button onClick={()=>nav(s.action_tab==="home"?"/dashboard":`/dashboard/${s.action_tab}`)}
                  style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"9px 18px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                  {s.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bid pipeline — shown before matched RFPs ── */}
      {recentBids.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>📨</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Your bid pipeline</span>
            </div>
            <button onClick={()=>nav("/dashboard/opportunities")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif" }}>View all →</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[...recentBids].sort((a,b)=>a.status==="awarded"?-1:b.status==="awarded"?1:0).map(b=>(
              <div key={b.id} style={{ background:"white", border:`1.5px solid ${b.status==="awarded"?"var(--teal,#18664A)":b.status==="shortlisted"?"#6384ff":"var(--border,#D4C9B5)"}`, borderRadius:10, overflow:"hidden" }}>
                {b.status==="awarded" && (
                  <div style={{ background:"var(--teal,#18664A)", padding:"5px 16px", fontSize:11, fontWeight:700, color:"white", letterSpacing:".04em" }}>🏆 Contract awarded</div>
                )}
                <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:2 }}>{b.request_title}</div>
                    <div style={{ display:"flex", gap:10, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
                      <span>{b.request_category}</span>
                      {b.buyer_name && <span>· 👤 {b.buyer_name}</span>}
                      {b.timeline   && <span>· ⏱ {b.timeline}</span>}
                      {b.request_deadline && <span>· 📅 Due {new Date(b.request_deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:`${bidStatusColor[b.status]}15`, padding:"5px 12px", borderRadius:99, flexShrink:0 }}>
                    <span style={{ fontSize:13 }}>{bidStatusIcon[b.status]}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:bidStatusColor[b.status], textTransform:"uppercase", letterSpacing:".06em" }}>{b.status.replace(/_/g," ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Matched RFPs ── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>📋</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Opportunities matching your profile</span>
          </div>
          <button onClick={()=>nav("/dashboard/opportunities")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif" }}>View all →</button>
        </div>
        {matchedRFPs.length === 0 ? (
          <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"28px", textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8, opacity:.35 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:4 }}>No matches yet</div>
            <div style={{ fontSize:13, color:"var(--muted,#67788D)" }}>Complete your profile so we can match you with open RFPs.</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {matchedRFPs.map(r=>(
              <div key={r.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{r.title}</span>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", padding:"2px 8px", borderRadius:99 }}>Matches your profile</span>
                  </div>
                  <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:8 }}>{r.description?.slice(0,100)}…</div>
                  <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
                    {r.category && <span>📂 {r.category}</span>}
                    {r.budget   && <span>💰 {r.budget}</span>}
                    {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                    {r.min_esg_score > 0 && <span style={{ color: esgResult?.score >= r.min_esg_score ? "var(--teal,#18664A)" : "var(--amber,#B8720A)" }}>🌱 Min ESG: {r.min_esg_score}{esgResult?.score < r.min_esg_score ? " ⚠ You need more" : " ✓ You qualify"}</span>}
                  </div>
                </div>
                <button onClick={()=>setBidModal(r)} style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"9px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", flexShrink:0 }}>
                  Submit bid →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unread notifications ── */}
      {notifs.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontSize:14 }}>🔔</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Notifications</span>
            <span style={{ background:"var(--red,#B84232)", color:"white", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99 }}>{notifs.length}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {notifs.map(n=>{
              const dest = fixNotifLink(n.link, n.category);
              const accentColor = n.type==="success"?"var(--teal,#18664A)":n.type==="warning"?"var(--amber,#B8720A)":"#6384ff";
              return (
                <div key={n.id} onClick={()=>dest&&nav(dest)}
                  style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderLeft:`3px solid ${accentColor}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:12, cursor:dest?"pointer":"default", transition:"box-shadow .15s" }}
                  onMouseEnter={e=>{ if(dest) e.currentTarget.style.boxShadow="0 4px 16px rgba(11,29,51,.08)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.boxShadow="none"; }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor, flexShrink:0, marginTop:5 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, lineHeight:1.55, color:"var(--navy,#0B1D33)" }}>{n.message}</div>
                    <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:3 }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {dest && <span style={{ fontSize:12, color:"var(--teal,#18664A)", flexShrink:0, alignSelf:"center" }}>→</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bid modal from home */}
      {bidModal && <BidSubmitModal rfp={bidModal} profile={profile} esgResult={esgResult} onClose={()=>setBidModal(null)} toast={toast}/>}
    </div>
  );
}

/* ─────────────────────────────────── SectionCard (module-level — MUST stay here)
 * Defining this inside VendorProfile caused React to treat it as a new component
 * type on every state change → inputs lost focus after one character typed.
 */
function SectionCard({ id, title, activeSection, onEdit, onCancel, onSave, saving, children, viewContent }) {
  const isEditing = activeSection === id;
  return (
    <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,29,51,.05)", marginBottom:12 }}>
      <div style={{ padding:"16px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom: isEditing ? "1px solid var(--border,#D4C9B5)" : "none" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{title}</div>
        {!isEditing
          ? <button onClick={()=>onEdit(id)} style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
          : <div style={{ display:"flex", gap:8 }}>
              <button onClick={onCancel} style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={onSave} disabled={saving} style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:saving?"wait":"pointer", fontFamily:"'DM Sans',sans-serif" }}>{saving?"Saving…":"Save"}</button>
            </div>
        }
      </div>
      <div style={{ padding:"18px 22px" }}>
        {isEditing ? children : viewContent}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── PROFILE tab ── */
function VendorProfile({ toast }) {
  const [profile, setProfile]   = useState(null);
  const [completeness, setComp] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editSection, setEdit]  = useState(null); // 'basics'|'categories'|'details'|'verification'|'documents'
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [docs, setDocs]         = useState([]);
  const [docFile, setDocFile]   = useState(null);
  const [docType, setDocType]   = useState("pan");
  const [uploading, setUploading] = useState(false);
  const [genLoading, setGenLoading] = useState("");
  // Verification
  const [gstInput, setGstInput] = useState("");
  const [panInput, setPanInput] = useState("");
  const [verifying, setVerifying] = useState("");
  const [gstResult, setGstResult] = useState(null);
  const [panResult, setPanResult] = useState(null);
  const [smartLookup, setSmartLookup] = useState("");
  const [smartResult, setSmartResult] = useState(null);
  const [smartLoading, setSmartLoading] = useState(false);

  const reload = () => {
    Promise.allSettled([vendorAPI.getMyProfile(), vendorAPI.completeness(), vendorAPI.getMyDocuments()])
      .then(([p,c,d])=>{
        if (p.status==="fulfilled") { setProfile(p.value.data); setHasProfile(true); setForm(p.value.data); setMajorCustomersText(parseJSON(p.value.data.major_customers).join(", ")); setGstInput(p.value.data.gstin||""); setPanInput(p.value.data.pan||""); setSmartLookup(p.value.data.gstin || p.value.data.pan || p.value.data.organization_name || ""); }
        else { setHasProfile(false); setForm({}); }
        if (c.status==="fulfilled") setComp(c.value.data);
        if (d.status==="fulfilled") setDocs(d.value.data);
      }).finally(()=>setLoading(false));
  };
  useEffect(()=>{ reload(); },[]);

  const save = async (partial = {}) => {
    setSaving(true);
    try {
      const payload = { ...form, ...partial, major_customers:toJSON(majorCustomersText.split(",").map(x=>x.trim()).filter(Boolean).slice(0,10)), women_ownership_percent: Number(form.women_ownership_percent||0), year_founded: form.year_founded?Number(form.year_founded):null };
      if (hasProfile) await vendorAPI.updateProfile(payload);
      else { await vendorAPI.createProfile(payload); setHasProfile(true); }
      toast.success("Saved!");
      setEdit(null);
      reload();
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSaving(false); }
  };

  const aiGenerate = async (field) => {
    setGenLoading(field);
    try {
      const kind = field === "impact_statement" ? "impact" : "business";
      const r = await vendorAPI.aiDescription({
        kind,
        context: {
          org_name: form.organization_name,
          location: form.location,
          category: parseJSON(form.service_categories)[0] || "",
          description: form.description,
        },
      });
      setForm(p=>({...p,[field]: r.data.text||""}));
    } catch { toast.error("AI unavailable — write it manually!"); }
    finally { setGenLoading(""); }
  };

  // Company autocomplete
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [enrichLoading, setEnrichLoading] = useState(false);
  const companySuggestTimer = useRef(null);

  const handleOrgNameChange = (val) => {
    setForm(p=>({...p, organization_name: val}));
    setCompanyQuery(val);
    clearTimeout(companySuggestTimer.current);
    if (val.length < 3) { setCompanySuggestions([]); return; }
    companySuggestTimer.current = setTimeout(async () => {
      try {
        const r = await vendorAPI.companySuggest(val);
        setCompanySuggestions(r.data || []);
      } catch { setCompanySuggestions([]); }
    }, 400);
  };

  const selectCompany = async (company) => {
    setCompanySuggestions([]);
    setForm(p=>({...p, organization_name: company.name || company.company_name || p.organization_name}));
    if (company.gstin || company.cin) {
      runSmartPrefill({ company_name: company.name || company.company_name, gstin: company.gstin, cin: company.cin });
    }
    setEnrichLoading(true);
    try {
      const r = await vendorAPI.aiCompanyEnrich({ company_name: company.name || company.company_name, cin: company.cin });
      const d = r.data;
      setForm(p=>({
        ...p,
        organization_name: d.organization_name || p.organization_name,
        location: d.location || p.location,
        description: d.description || p.description,
        year_founded: d.year_founded ? String(d.year_founded) : p.year_founded,
      }));
      toast.success("Profile auto-filled from MCA data!");
    } catch { toast.error("Could not enrich company data"); }
    finally { setEnrichLoading(false); }
  };

  const runSmartPrefill = async (source = {}) => {
    const value = (source.gstin || source.pan || source.cin || source.company_name || smartLookup || "").trim();
    if (!value) { toast.error("Enter company name, GSTIN or PAN"); return; }
    setSmartLoading(true);
    setSmartResult(null);
    try {
      const payload = { consent:true };
      if (source.gstin || looksLikeGSTIN(value)) payload.gstin = (source.gstin || value).toUpperCase();
      else if (source.pan || looksLikePAN(value)) payload.pan = (source.pan || value).toUpperCase();
      else if (source.cin) payload.cin = source.cin;
      else payload.company_name = source.company_name || value;
      const r = await vendorAPI.smartPrefill(payload);
      setSmartResult(r.data);
      const nextProfile = r.data.profile || {};
      const prefill = r.data.prefill || {};
      setForm(p=>mergePrefillIntoForm({ ...p, ...nextProfile }, prefill));
      if (prefill.gstin) setGstInput(prefill.gstin);
      if (prefill.pan) setPanInput(prefill.pan);
      toast.success(r.data.provider === "stub" ? "Saved in demo mode. Add Surepass token for live registry data." : "Business details fetched and saved.");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not fetch business details");
    } finally {
      setSmartLoading(false);
    }
  };

  const verifyGST = async () => {
    setVerifying("gst");
    try { const r=await vendorAPI.verifyGST({gstin:gstInput}); setGstResult(r.data); if(r.data.success){toast.success("GST verified!"); if(r.data.legal_name)setForm(p=>({...p,organization_name:r.data.legal_name, gstin:gstInput, location:r.data.address || p.location})); reload();} }
    catch { toast.error("Verification failed"); } finally { setVerifying(""); }
  };
  const verifyPAN = async () => {
    setVerifying("pan");
    try { const r=await vendorAPI.verifyPAN({pan:panInput}); setPanResult(r.data); if(r.data.success){ setForm(p=>({...p,pan:panInput})); toast.success("PAN verified!"); reload();} }
    catch { toast.error("Verification failed"); } finally { setVerifying(""); }
  };
  const uploadDoc = async () => {
    if (!docFile) { toast.error("Select a file"); return; }
    setUploading(true);
    try { const fd=new FormData(); fd.append("file",docFile); fd.append("document_type",docType); await vendorAPI.uploadDocument(fd); toast.success("Uploaded!"); setDocFile(null); reload(); }
    catch(err) { toast.error(err.response?.data?.detail||"Upload failed"); } finally { setUploading(false); }
  };

  if (loading) return <div className="skeleton" style={{height:400,borderRadius:12}}/>;

  const score = completeness?.score || 0;
  const scoreColor = score>=70?"var(--teal,#18664A)":score>=40?"var(--amber,#B8720A)":"var(--red,#B84232)";
  const cats  = parseJSON(form.service_categories);
  const certs = parseJSON(form.certification_types);
  const sdgs  = parseJSON(form.sdg_tags);
  const majorCustomers = parseJSON(form.major_customers);

  // SectionCard is defined at module level above to prevent focus loss on re-render
  const sc = { activeSection:editSection, onEdit:setEdit, onCancel:()=>setEdit(null), onSave:()=>save(), saving };

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      {/* Profile score bar */}
      <div style={{ background:"var(--navy,#0B1D33)", borderRadius:12, padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(242,235,217,.5)", marginBottom:6 }}>Profile completeness</div>
          <div style={{ background:"rgba(255,255,255,.1)", borderRadius:99, height:6, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${score}%`, background:score>=70?"#5FCFA0":score>=40?"#F5B342":"#F5937F", borderRadius:99, transition:"width 1s cubic-bezier(.4,0,.2,1)" }}/>
          </div>
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:score>=70?"#5FCFA0":score>=40?"#F5B342":"#F5937F", lineHeight:1, flexShrink:0 }}>{score}<span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"rgba(242,235,217,.4)", fontWeight:400 }}>/100</span></div>
      </div>

      {/* Basics section */}
      <SectionCard id="basics" title="Business identity" {...sc}
        viewContent={
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Row label="Organisation" value={form.organization_name} hint="+5%" hintMsg="Add your organisation name to gain +5% profile score"/>
            <Row label="Description"  value={form.description?.length>50?form.description:undefined} hint="+5%" hintMsg="Write a description (50+ chars) to gain +5% profile score"/>
            <Row label="Impact"       value={form.impact_statement}/>
            <Row label="Location"     value={form.location} hint="+5%" hintMsg="Add your location to gain +5% profile score"/>
            <Row label="Website"      value={form.website} hint="+5%" hintMsg="Add your website to gain +5% profile score"/>
            <Row label="Major customers" value={majorCustomers.join(", ")||undefined}/>
            <Row label="Phone"        value={form.phone}/>
            {form.is_women_owned && <Row label="Women-owned" value="Yes ✊"/>}
          </div>
        }>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Organisation name with company autocomplete */}
          <div style={{ position:"relative" }}>
            <Input label="Organisation name *" value={form.organization_name||""} onChange={e=>handleOrgNameChange(e.target.value)} placeholder="Your company name"/>
            {enrichLoading && <div style={{ position:"absolute", right:10, top:32, fontSize:11, color:"var(--teal,#18664A)" }}>Enriching…</div>}
            {companySuggestions.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:100, background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:8, boxShadow:"0 8px 24px rgba(11,29,51,.12)", overflow:"hidden" }}>
                {companySuggestions.slice(0,5).map((c,i)=>(
                  <button key={i} onClick={()=>selectCompany(c)}
                    style={{ width:"100%", textAlign:"left", padding:"10px 14px", background:"none", border:"none", borderBottom:"1px solid var(--border,#D4C9B5)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--navy,#0B1D33)", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--cream,#F2EBD9)"}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    <span>{c.name || c.company_name}</span>
                    {c.cin && <span style={{ fontSize:10, color:"var(--muted,#67788D)" }}>{c.cin}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:".08em", textTransform:"uppercase" }}>Description</label>
              <AIBtn loading={genLoading==="description"} onClick={()=>aiGenerate("description")}/>
            </div>
            <Textarea value={form.description||""} rows={3} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe your services and impact…"/>
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:".08em", textTransform:"uppercase" }}>Impact statement</label>
              <AIBtn loading={genLoading==="impact_statement"} onClick={()=>aiGenerate("impact_statement")}/>
            </div>
            <Input value={form.impact_statement||""} onChange={e=>setForm(p=>({...p,impact_statement:e.target.value}))} placeholder="We create sustainable livelihoods for…"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Location" value={form.location||""} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="City, State"/>
            <Input label="Phone" value={form.phone||""} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 XXXXX XXXXX"/>
            <Input label="Add website" value={form.website||""} onChange={e=>setForm(p=>({...p,website:e.target.value}))} placeholder="https://yourwebsite.com"/>
            <Input label="Year founded" type="number" value={form.year_founded||""} onChange={e=>setForm(p=>({...p,year_founded:e.target.value}))} placeholder="2018"/>
          </div>
          <Input label="Major customers (up to 10)" value={majorCustomersText} onChange={e=>setMajorCustomersText(e.target.value)} placeholder="Customer One, Customer Two"/>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:14, fontWeight:500, color:"var(--navy,#0B1D33)" }}>
            <input type="checkbox" checked={!!form.is_women_owned} onChange={e=>setForm(p=>({...p,is_women_owned:e.target.checked}))}/>
            Women-owned business
          </label>
        </div>
      </SectionCard>

      {/* Categories section */}
      <SectionCard id="categories" title="Categories & certifications" {...sc}
        viewContent={
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Row label="Service categories" value={cats.join(", ")||undefined} hint="+5%" hintMsg="Select your service categories to gain +5% profile score"/>
            <Row label="Certifications"     value={certs.map(c=>c.replace(/_/g," ")).join(", ")||undefined}/>
            <Row label="SDG alignment"      value={sdgs.join(", ")||undefined}/>
          </div>
        }>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <TagPicker label="Service categories" options={SERVICE_CATEGORIES} selected={cats} onChange={v=>setForm(p=>({...p,service_categories:toJSON(v)}))} allowCustom showIcons onAddCustom={async name=>{ try { const r=await vendorAPI.aiSector({name}); const value=r.data.name; setForm(p=>({...p,service_categories:toJSON([...new Set([...parseJSON(p.service_categories),value])])})); return r.data; } catch(err) { toast.error(err.response?.data?.detail||"Could not add sector"); throw err; } }}/>
          <TagPicker label="Certifications" options={CERT_TYPES} selected={certs} onChange={v=>setForm(p=>({...p,certification_types:toJSON(v)}))} display={v=>v.replace(/_/g," ")}/>
          <TagPicker label="SDG alignment" options={SDG_TAGS} selected={sdgs} onChange={v=>setForm(p=>({...p,sdg_tags:toJSON(v)}))}/>
        </div>
      </SectionCard>

      {/* Details section */}
      <SectionCard id="details" title="Business details" {...sc}
        viewContent={
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Row label="Team size"    value={form.team_size_band}/>
            <Row label="Turnover"     value={form.annual_turnover_band}/>
          </div>
        }>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Select label="Team size" value={form.team_size_band||""} onChange={e=>setForm(p=>({...p,team_size_band:e.target.value}))}
            options={[{value:"",label:"Select"},{value:"1-10",label:"1–10 people"},{value:"11-50",label:"11–50 people"},{value:"51-200",label:"51–200 people"},{value:"200+",label:"200+ people"}]}/>
          <Select label="Annual turnover" value={form.annual_turnover_band||""} onChange={e=>setForm(p=>({...p,annual_turnover_band:e.target.value}))}
            options={[{value:"",label:"Select"},{value:"<10L",label:"< ₹10L"},{value:"10L-1Cr",label:"₹10L – ₹1Cr"},{value:"1Cr-10Cr",label:"₹1Cr – ₹10Cr"},{value:"10Cr+",label:"₹10Cr+"}]}/>
        </div>
      </SectionCard>

      {/* Verification section */}
      <SectionCard id="verification" title="Business verification" {...sc}
        viewContent={
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Row label="GST" value={profile?.gstin_verified ? "✅ Verified" : profile?.gstin ? "⏳ Not verified yet" : undefined}/>
            <Row label="PAN" value={panResult?.success ? "✅ Verified" : profile?.pan ? profile.pan : undefined}/>
          </div>
        }>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"14px 16px", border:"1.5px solid var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--teal,#18664A)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Smart registry prefill</div>
            <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.55, marginBottom:10 }}>
              Enter company name, GSTIN or PAN. We fetch only the useful KYB data for this profile and save verified fields.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={smartLookup} onChange={e=>setSmartLookup(e.target.value.toUpperCase())} placeholder="Company name, GSTIN or PAN"
                style={{ flex:1, minWidth:0, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid rgba(24,102,74,.25)", borderRadius:6, outline:"none" }}/>
              <Btn onClick={()=>runSmartPrefill()} loading={smartLoading} size="sm">Auto-fill</Btn>
            </div>
            {smartResult && (
              <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                {(smartResult.checks || []).slice(0,4).map((c,i)=>(
                  <span key={i} style={{ fontSize:11, fontWeight:800, color:c.success?"var(--teal,#18664A)":"var(--amber,#B8720A)", background:"white", border:"1px solid rgba(24,102,74,.18)", padding:"4px 8px", borderRadius:99 }}>
                    {c.type}: {c.success ? (c.stub ? "demo" : "found") : "not found"}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>GST Number</label>
            <div style={{ display:"flex", gap:8 }}>
              <input value={gstInput} onChange={e=>setGstInput(e.target.value.toUpperCase())} placeholder="Enter GSTIN (15 chars)"
                style={{ flex:1, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--bg,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
              <Btn onClick={verifyGST} loading={verifying==="gst"} size="sm">Verify</Btn>
            </div>
            {gstResult && <VerifyResult result={gstResult}/>}
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>PAN Number</label>
            <div style={{ display:"flex", gap:8 }}>
              <input value={panInput} onChange={e=>setPanInput(e.target.value.toUpperCase())} placeholder="Enter PAN (e.g. ABCDE1234F)"
                style={{ flex:1, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--bg,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
              <Btn onClick={verifyPAN} loading={verifying==="pan"} size="sm">Verify</Btn>
            </div>
            {panResult && <VerifyResult result={panResult}/>}
          </div>
        </div>
      </SectionCard>

      {/* Documents section */}
      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>
        <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--border,#D4C9B5)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>KYC Documents</div>
          <span style={{ fontSize:12, color:"var(--muted,#67788D)" }}>{docs.length} uploaded</span>
        </div>
        <div style={{ padding:"18px 22px" }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:16, flexWrap:"wrap" }}>
            <Select value={docType} onChange={e=>setDocType(e.target.value)} style={{ minWidth:160 }}
              options={[{value:"pan",label:"PAN Card"},{value:"aadhaar",label:"Aadhaar"},{value:"gst",label:"GST Cert"},{value:"registration",label:"Business Reg"},{value:"other",label:"Other"}]}/>
            <label style={{ flex:1, minWidth:160, cursor:"pointer" }}>
              <div style={{ padding:"10px 14px", border:`2px dashed ${docFile?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:8, textAlign:"center", fontSize:13, color:docFile?"var(--teal,#18664A)":"var(--muted,#67788D)", background:docFile?"var(--teal-bg,#E4F2EB)":"var(--cream,#F2EBD9)" }}>
                {docFile ? `✅ ${docFile.name}` : "Click to select PDF/image"}
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>setDocFile(e.target.files[0])} style={{ display:"none" }}/>
            </label>
            <Btn onClick={uploadDoc} loading={uploading} size="sm">Upload</Btn>
          </div>
          {docs.length === 0
            ? <div style={{ textAlign:"center", padding:"20px", color:"var(--muted,#67788D)", fontSize:13 }}>No documents yet — upload at least one to get verified.</div>
            : docs.map(d=>(
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border,#D4C9B5)" }}>
                <span style={{ fontSize:20 }}>📄</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--navy,#0B1D33)" }}>{d.original_name}</div>
                  <div style={{ fontSize:11, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".05em" }}>{d.document_type} · {d.status}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {d.view_url && (
                    <a href={d.view_url} target="_blank" rel="noreferrer"
                      style={{ fontSize:12, color:"var(--teal,#18664A)", textDecoration:"none", fontWeight:600 }}>View</a>
                  )}
                  <span style={{ fontSize:16 }}>{d.status==="verified"?"✅":d.status==="rejected"?"❌":"⏳"}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── SERVICES tab ── */
function VendorServices({ toast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ title:"", description:"", category:"", price_range:"", unit:"" });
  const [saving, setSaving]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [website, setWebsite] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [draftLoading, setDraftLoading] = useState(false);
  const [approving, setApproving] = useState("");
  const [websiteImage, setWebsiteImage] = useState("");

  const load = ()=>{
    Promise.allSettled([vendorAPI.getMyServices(), vendorAPI.getMyProfile()])
      .then(([s,p])=>{
        if (s.status==="fulfilled") setServices(s.value.data);
        if (p.status==="fulfilled") {
          setProfile(p.value.data);
          setWebsite(current=>current || p.value.data.website || "");
        }
      }).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const genDescription = async () => {
    if (!form.title || !form.category) { toast.error("Enter service title and category first"); return; }
    setGenLoading(true);
    try {
      const r = await vendorAPI.aiDescription({
        kind: "service",
        context: { org_name: form.title, category: form.category },
      });
      setForm(p=>({...p, description: r.data.text||""}));
    } catch { toast.error("AI unavailable"); }
    finally { setGenLoading(false); }
  };

  const save = async()=>{
    if(!form.title.trim()||!form.category){ toast.error("Title and category required"); return; }
    setSaving(true);
    try{ const sector=await vendorAPI.aiSector({name:form.category}); await vendorAPI.addService({...form,category:sector.data.name}); toast.success("Service added!"); setModal(false); setForm({title:"",description:"",category:"",price_range:"",unit:""}); load(); }
    catch(err){ toast.error(err.response?.data?.detail||"Failed"); }finally{ setSaving(false); }
  };

  const generateServiceDrafts = async () => {
    if (!website.trim()) { toast.error("Add your public website URL first"); return; }
    setDraftLoading(true);
    try {
      const r = await vendorAPI.aiServiceDrafts({ website_url:website.trim(), category:parseJSON(profile?.service_categories)[0] || profile?.category || "" });
      setDrafts(r.data.drafts || []);
      setWebsiteImage(r.data.image_url || "");
      toast.success(`Created ${(r.data.drafts||[]).length} draft service${(r.data.drafts||[]).length===1?"":"s"}. Review before adding.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not read this website");
    } finally { setDraftLoading(false); }
  };

  const updateDraft = (index, field, value) => setDrafts(items=>items.map((item,i)=>i===index?{...item,[field]:value}:item));
  const removeDraft = index => setDrafts(items=>items.filter((_,i)=>i!==index));
  const approveDraft = async (index) => {
    const draft = drafts[index];
    if (!draft?.title?.trim() || !draft?.category?.trim()) { toast.error("Each service needs a title and category"); return; }
    setApproving(String(index));
    try {
      const sector = await vendorAPI.aiSector({name:draft.category});
      await vendorAPI.addService({...draft,category:sector.data.name});
      removeDraft(index);
      toast.success("Draft added to your services");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Could not add service"); }
    finally { setApproving(""); }
  };

  if(loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:70,borderRadius:10}}/>)}</div>;

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Your services</h2>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>What you offer to buyers</p>
        </div>
        <Btn onClick={()=>setModal(true)} size="sm">+ Add service</Btn>
      </div>

      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:4 }}>Draft services from your website</div>
        <div style={{ fontSize:12, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:12 }}>We will read public website text and suggest editable drafts. Nothing is added until you approve it.</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://yourwebsite.com"
            style={{ flex:1, minWidth:220, padding:"10px 12px", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, fontFamily:"'DM Sans',sans-serif" }}/>
          <Btn onClick={generateServiceDrafts} loading={draftLoading} size="sm">Create drafts</Btn>
        </div>
        {websiteImage && <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12, paddingTop:12, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          <img src={websiteImage} alt="Website branding preview" style={{ width:44, height:44, objectFit:"contain", borderRadius:8, background:"white", border:"1px solid var(--border,#D4C9B5)" }}/>
          <div style={{ flex:1, fontSize:11, color:"var(--muted,#67788D)" }}>Website branding preview. This is not a verification badge.</div>
          <Btn size="sm" variant="ghost" onClick={async()=>{ await vendorAPI.updateProfile({logo_url:websiteImage}); setProfile(p=>({...p,logo_url:websiteImage})); toast.success("Website image saved to your profile"); }}>Use image</Btn>
        </div>}
      </div>

      {drafts.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--teal,#18664A)" }}>{drafts.length} draft{drafts.length===1?"":"s"} ready for review</div>
          {drafts.map((draft,index)=>(
            <div key={`${draft.title}-${index}`} style={{ background:"var(--cream,#F2EBD9)", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <Input label="Service title" value={draft.title||""} onChange={e=>updateDraft(index,"title",e.target.value)}/>
                <Input label="Category" value={draft.category||""} onChange={e=>updateDraft(index,"category",e.target.value)} placeholder="Type a sector"/>
              </div>
              <Textarea value={draft.description||""} rows={2} onChange={e=>updateDraft(index,"description",e.target.value)} placeholder="Service description"/>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:10 }}>
                <Btn onClick={()=>removeDraft(index)} variant="ghost" size="sm">Remove draft</Btn>
                <Btn onClick={()=>approveDraft(index)} loading={approving===String(index)} size="sm">Add service</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {services.length === 0
        ? <Empty icon="◇" title="No services yet" desc="Add services so buyers can see exactly what you offer" action={<Btn onClick={()=>setModal(true)}>Add your first service</Btn>}/>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {services.map(s=>(
              <div key={s.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:"16px 20px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:4 }}>{s.title}</div>
                  <div style={{ color:"var(--teal,#18664A)", marginBottom:6 }}><SectorIcon iconKey={sectorIconKey(s.category)} size={22}/></div>
                  {s.description && <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:8 }}>{s.description}</div>}
                  <div style={{ display:"flex", gap:10, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
                    {s.category && <span style={{ background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", padding:"2px 9px", borderRadius:99, fontWeight:600, fontSize:11 }}>{s.category}</span>}
                    {s.price_range && <span>💰 {s.price_range}</span>}
                    {s.unit && <span>📦 per {s.unit}</span>}
                  </div>
                </div>
                <Btn onClick={()=>setConfirmDelete(s.id)} variant="ghost" size="sm">Remove</Btn>
              </div>
            ))}
          </div>
      }

      <Modal open={modal} onClose={()=>setModal(false)} title="Add service">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input label="Service title *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Organic Cotton Supply"/>
          <Input label="Category or sector *" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="Type a sector, e.g. Hospital Equipment"/>
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:".08em", textTransform:"uppercase" }}>Description</label>
              <AIBtn loading={genLoading} onClick={genDescription}/>
            </div>
            <Textarea value={form.description} rows={3} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe what you provide…"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Price range" value={form.price_range} onChange={e=>setForm(p=>({...p,price_range:e.target.value}))} placeholder="₹500–₹2000"/>
            <Input label="Unit" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="kg / piece / hour"/>
          </div>
          <Btn onClick={save} loading={saving} fullWidth>Add service</Btn>
        </div>
      </Modal>
      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{ await vendorAPI.deleteService(confirmDelete); toast.success("Removed"); load(); }} title="Remove service" message="Remove this service?" variant="danger"/>
    </div>
  );
}

/* ─────────────────────────────────── OPPORTUNITIES tab ── */
function VendorOpportunities({ toast }) {
  const nav = useNavigate();
  const [view, setView]         = useState("browse"); // 'browse'|'bids'
  const [requests, setRequests] = useState([]);
  const [bids, setBids]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [profile, setProfile]   = useState(null);
  const [docs, setDocs]         = useState([]);
  const [esgResult, setEsgResult] = useState(null);
  const [bidModal, setBidModal] = useState(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);
  const [buyerModal, setBuyerModal] = useState(null); // {name, email, rfp_title}

  const load = () => {
    Promise.allSettled([
      buyerAPI.listRequests(), bidAPI.myBids(),
      vendorAPI.getMyProfile(), vendorAPI.esgCompliance(),
      vendorAPI.getMyDocuments(),
    ]).then(([r,b,p,e,d])=>{
      if(r.status==="fulfilled") setRequests(r.value.data);
      if(b.status==="fulfilled") setBids(b.value.data);
      if(p.status==="fulfilled") setProfile(p.value.data);
      if(e.status==="fulfilled") setEsgResult(e.value.data);
      if(d.status==="fulfilled") setDocs(d.value.data);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const vendorCats = parseJSON(profile?.service_categories);

  const isMatch = r => vendorCats.some(c =>
    c.toLowerCase().includes((r.category||"").toLowerCase().split("&")[0].trim()) ||
    (r.category||"").toLowerCase().includes(c.toLowerCase().split("&")[0].trim()));

  const filtered = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description||"").toLowerCase().includes(search.toLowerCase()));

  const statusColor = { submitted:"var(--teal)", under_review:"var(--amber,#B8720A)", shortlisted:"#6384ff", awarded:"var(--teal,#18664A)", declined:"var(--red,#B84232)" };
  const statusIcon  = { submitted:"📨", under_review:"👀", shortlisted:"⭐", awarded:"🏆", declined:"✗" };

  if(loading) return <div style={{display:"flex",flexDirection:"column",gap:10}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:90,borderRadius:10}}/>)}</div>;

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      {/* Toggle */}
      <div style={{ display:"flex", background:"var(--cream,#F2EBD9)", borderRadius:10, padding:4, marginBottom:24, width:"fit-content" }}>
        {[{v:"browse",label:"Browse RFPs"},{v:"bids",label:`My Bids (${bids.length})`}].map(t=>(
          <button key={t.v} onClick={()=>setView(t.v)} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background:view===t.v?"white":"transparent", color:view===t.v?"var(--navy,#0B1D33)":"var(--muted,#67788D)", boxShadow:view===t.v?"0 2px 8px rgba(11,29,51,.08)":"none", transition:"all .18s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse RFPs */}
      {view === "browse" && (() => {
        const kycDone = profile?.gstin_verified || profile?.pan_verified || docs.length > 0;
        return (<>
        <div style={{ marginBottom:16 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search open RFPs…"
            style={{ width:"100%", padding:"11px 16px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
        </div>
        {filtered.length === 0
          ? <Empty icon="📋" title="No RFPs found"/>
          : !kycDone
          ? (
            /* ── KYC gate: real cards replaced with blurred placeholders + overlay ── */
            <div style={{ position:"relative" }}>
              {/* Real tiles rendered but blurred — pointer events disabled so nothing is clickable */}
              <div style={{ filter:"blur(3px)", pointerEvents:"none", userSelect:"none", display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.slice(0,3).map(r=>{
                  const match = isMatch(r);
                  return (
                    <div key={r.id} style={{ background:"white", border:`1.5px solid ${match?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, boxShadow:"0 2px 10px rgba(11,29,51,.05)" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{r.title}</span>
                          {match && <span style={{ fontSize:10, fontWeight:700, background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", padding:"2px 8px", borderRadius:99 }}>✓ Matches your profile</span>}
                        </div>
                        <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55, marginBottom:8 }}>{r.description?.slice(0,120)}…</div>
                        <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
                          {r.category && <span>📂 {r.category}</span>}
                          {r.budget   && <span>💰 {r.budget}</span>}
                          {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                          <span>📨 {r.bid_count||0} bids</span>
                        </div>
                      </div>
                      <div style={{ background:"var(--teal,#18664A)", color:"white", borderRadius:6, padding:"9px 16px", fontSize:12, fontWeight:600 }}>Bid →</div>
                    </div>
                  );
                })}
              </div>
              {/* Overlay — anchored to top so lock message sits just below the search bar */}
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", gap:12, background:"rgba(255,255,255,.72)", borderRadius:12, paddingTop:28, textAlign:"center" }}>
                <div style={{ fontSize:36 }}>🔒</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--navy,#0B1D33)" }}>
                  {filtered.length} opportunit{filtered.length===1?"y":"ies"} found
                </div>
                <div style={{ fontSize:13, color:"var(--muted,#67788D)", maxWidth:300, lineHeight:1.65 }}>
                  Verify your GST, PAN or upload a document to unlock and bid on these opportunities.
                </div>
                <button onClick={()=>nav("/dashboard/profile")}
                  style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"12px 28px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .18s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                  Complete verification →
                </button>
              </div>
            </div>
          )
          : (
            /* ── Unlocked: real cards with Bid buttons ── */
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(r=>{
                const match = isMatch(r);
                const meetsESG = !r.min_esg_score || (esgResult?.score||0) >= r.min_esg_score;
                return (
                  <div key={r.id} style={{ background:"white", border:`1.5px solid ${match?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, boxShadow:"0 2px 10px rgba(11,29,51,.05)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{r.title}</span>
                        {match && <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", padding:"2px 8px", borderRadius:99 }}>✓ Matches your profile</span>}
                        {!meetsESG && r.min_esg_score > 0 && <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", background:"var(--amber-bg,#FDF3E4)", color:"var(--amber,#B8720A)", padding:"2px 8px", borderRadius:99 }}>Min ESG: {r.min_esg_score}</span>}
                      </div>
                      <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55, marginBottom:8 }}>{r.description?.slice(0,120)}…</div>
                      <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
                        {r.category && <span>📂 {r.category}</span>}
                        {r.budget   && <span>💰 {r.budget}</span>}
                        {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                        <span>📨 {r.bid_count||0} bids</span>
                      </div>
                    </div>
                    <Btn onClick={()=>setBidModal(r)} size="sm" style={{ flexShrink:0 }}>Bid →</Btn>
                  </div>
                );
              })}
            </div>
          )
        }
        </>);
      })()}

      {/* My Bids */}
      {view === "bids" && (<>
        {bids.length === 0
          ? <Empty icon="📨" title="No bids yet" desc="Browse RFPs above and submit your first proposal"/>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...bids].sort((a,b)=>a.status==="awarded"?-1:b.status==="awarded"?1:0).map(b=>(
                <div key={b.id} style={{ background:"white", border:`1.5px solid ${b.status==="awarded"?"var(--teal,#18664A)":b.status==="shortlisted"?"#6384ff":"var(--border,#D4C9B5)"}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
                  {/* Awarded banner */}
                  {b.status==="awarded" && (
                    <div style={{ background:"var(--teal,#18664A)", padding:"8px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:16 }}>🏆</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"white" }}>Contract awarded — you won!</span>
                      </div>
                      {b.buyer_email && (
                        <a href={`mailto:${b.buyer_email}`} style={{ fontSize:12, color:"rgba(255,255,255,.8)", textDecoration:"none", fontWeight:500 }}>
                          Contact buyer ✉️
                        </a>
                      )}
                    </div>
                  )}
                  <div style={{ padding:"18px 22px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{b.request_title}</div>
                        <div style={{ display:"flex", gap:10, fontSize:12, color:"var(--muted,#67788D)", marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
                          <span>{b.request_category}</span>
                          {b.buyer_name && (
                            <button onClick={()=>setBuyerModal({name:b.buyer_name, email:b.buyer_email, rfp_title:b.request_title, deadline:b.request_deadline, status:b.request_status})}
                              style={{ background:"none", border:"none", cursor:"pointer", padding:0, fontSize:12, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif", fontWeight:600, textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
                              👤 {b.buyer_name}
                            </button>
                          )}
                          {b.request_deadline && <span>· 📅 Due {new Date(b.request_deadline).toLocaleDateString()}</span>}
                        </div>
                        <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.55, marginBottom:8 }}>{b.cover_note?.slice(0,160)}…</div>
                        <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)" }}>
                          {b.proposed_price && <span>💰 {b.proposed_price}</span>}
                          {b.timeline       && <span>⏱ {b.timeline}</span>}
                        </div>
                        {b.buyer_note && <div style={{ marginTop:10, fontSize:12, padding:"8px 12px", background:"var(--cream,#F2EBD9)", borderRadius:8, color:"var(--body,#253446)" }}>💬 Buyer note: {b.buyer_note}</div>}
                      </div>
                      <div style={{ flexShrink:0, textAlign:"right" }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${statusColor[b.status]}18`, padding:"5px 12px", borderRadius:99 }}>
                          <span style={{ fontSize:13 }}>{statusIcon[b.status]}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:statusColor[b.status], textTransform:"uppercase", letterSpacing:".06em" }}>{b.status.replace(/_/g," ")}</span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border,#D4C9B5)", display:"flex", gap:8, flexWrap:"wrap" }}>
                      {["submitted","under_review"].includes(b.status) && (
                        <Btn onClick={()=>setConfirmWithdraw(b.id)} variant="ghost" size="sm">Withdraw bid</Btn>
                      )}
                      {b.status==="awarded" && b.buyer_email && (
                        <a href={`mailto:${b.buyer_email}`} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, textDecoration:"none", fontFamily:"'DM Sans',sans-serif" }}>
                          ✉️ Email {b.buyer_name||"buyer"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </>)}

      {bidModal && <BidSubmitModal rfp={bidModal} profile={profile} esgResult={esgResult} onClose={()=>{ setBidModal(null); load(); }} toast={toast}/>}
      <ConfirmModal open={!!confirmWithdraw} onClose={()=>setConfirmWithdraw(null)} onConfirm={async()=>{ await bidAPI.withdraw(confirmWithdraw); toast.success("Bid withdrawn"); load(); }} title="Withdraw bid" message="Withdraw this bid? You can resubmit later." variant="danger"/>

      {/* Buyer info modal */}
      {buyerModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setBuyerModal(null)}}
          style={{ position:"fixed", inset:0, background:"rgba(11,29,51,.5)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:20 }}>
          <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:16, width:"100%", maxWidth:400, padding:"28px", boxShadow:"0 24px 80px rgba(11,29,51,.2)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Buyer details</div>
              <button onClick={()=>setBuyerModal(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--muted,#67788D)", lineHeight:1 }}>×</button>
            </div>
            <div style={{ background:"var(--navy,#0B1D33)", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--cream,#F2EBD9)", marginBottom:4 }}>{buyerModal.name}</div>
              <div style={{ fontSize:12, color:"rgba(242,235,217,.55)" }}>Buyer · {buyerModal.rfp_title}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              {buyerModal.email && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"var(--cream,#F2EBD9)", borderRadius:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".06em" }}>Email</span>
                  <a href={`mailto:${buyerModal.email}`} style={{ fontSize:13, color:"var(--teal,#18664A)", fontWeight:600, textDecoration:"none" }}>{buyerModal.email}</a>
                </div>
              )}
              {buyerModal.deadline && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"var(--cream,#F2EBD9)", borderRadius:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".06em" }}>RFP deadline</span>
                  <span style={{ fontSize:13, color:"var(--navy,#0B1D33)", fontWeight:600 }}>{new Date(buyerModal.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"var(--cream,#F2EBD9)", borderRadius:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".06em" }}>RFP status</span>
                <span style={{ fontSize:13, color:"var(--navy,#0B1D33)", fontWeight:600, textTransform:"capitalize" }}>{buyerModal.status||"active"}</span>
              </div>
            </div>
            {buyerModal.email && (
              <a href={`mailto:${buyerModal.email}`}
                style={{ display:"block", width:"100%", textAlign:"center", background:"var(--teal,#18664A)", color:"white", borderRadius:6, padding:"11px", fontSize:13, fontWeight:600, textDecoration:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" }}>
                ✉️ Send email to {buyerModal.name.split(" ")[0]}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── Bid submit modal (shared) ── */
function BidSubmitModal({ rfp, profile, esgResult, onClose, toast }) {
  const [form, setForm]       = useState({ cover_note:"", proposed_price:"", timeline:"" });
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting]     = useState(false);

  const draftWithAI = async () => {
    setDrafting(true);
    try {
      const r = await vendorAPI.aiBidDraft({ rfp_id: rfp.id });
      setForm(p=>({
        ...p,
        cover_note: r.data.cover_note || "",
        proposed_price: r.data.suggested_price_range || p.proposed_price,
        timeline: r.data.suggested_timeline || p.timeline,
      }));
      toast.success("AI drafted your proposal — review and edit it!");
    } catch { toast.error("AI unavailable — write it manually!"); }
    finally { setDrafting(false); }
  };

  const submit = async () => {
    if (!form.cover_note.trim()) { toast.error("Write a cover note"); return; }
    setSubmitting(true);
    try {
      await bidAPI.submit({ request_id:rfp.id, cover_note:form.cover_note, proposed_price:form.proposed_price, timeline:form.timeline });
      toast.success("Bid submitted!");
      onClose();
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={onClose} title="Submit proposal" width={560}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {/* RFP context */}
        <div style={{ padding:"14px 16px", background:"var(--cream,#F2EBD9)", borderRadius:10, border:"1px solid var(--border,#D4C9B5)" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{rfp.title}</div>
          <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.5 }}>{rfp.description?.slice(0,120)}…</div>
          <div style={{ display:"flex", gap:12, marginTop:8, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
            {rfp.budget && <span>💰 {rfp.budget}</span>}
            {rfp.deadline && <span>📅 {new Date(rfp.deadline).toLocaleDateString()}</span>}
            {rfp.min_esg_score > 0 && (
              <span style={{ color:(esgResult?.score||0)>=rfp.min_esg_score?"var(--teal,#18664A)":"var(--amber,#B8720A)" }}>
                🌱 Min ESG {rfp.min_esg_score} {(esgResult?.score||0)>=rfp.min_esg_score?"· ✓ You qualify":"· ⚠ Below requirement"}
              </span>
            )}
          </div>
        </div>

        {/* Cover note with AI */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--text3,#67788D)", letterSpacing:".08em", textTransform:"uppercase" }}>Cover note *</label>
            <button onClick={draftWithAI} disabled={drafting} style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:99, cursor:drafting?"wait":"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
              {drafting ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Drafting…</> : <>Draft proposal</>}
            </button>
          </div>
          <Textarea value={form.cover_note} rows={5} onChange={e=>setForm(p=>({...p,cover_note:e.target.value}))} placeholder="Describe why you are the right vendor — your experience, approach, and unique value…"/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="Proposed price" value={form.proposed_price} onChange={e=>setForm(p=>({...p,proposed_price:e.target.value}))} placeholder="₹50,000"/>
          <Input label="Timeline" value={form.timeline} onChange={e=>setForm(p=>({...p,timeline:e.target.value}))} placeholder="3 weeks"/>
        </div>

        <Btn onClick={submit} loading={submitting} fullWidth size="lg">Submit proposal →</Btn>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────── ESG helpers (module-level — prevents focus loss) ── */
function ESGNumField({ label, value, onChange, max, placeholder }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"var(--text3,#67788D)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:5 }}>{label}</label>
      <input
        type="number" value={value} min="0" max={max}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || (max ? `0 – ${max}` : "Enter value")}
        style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--bg,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}
      />
    </div>
  );
}
function ESGBoolField({ label, checked, onChange }) {
  return (
    <div onClick={()=>onChange(!checked)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${checked?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:checked?"var(--teal-bg,#E4F2EB)":"white", cursor:"pointer", marginBottom:10, transition:"all .16s" }}>
      <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${checked?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:checked?"var(--teal,#18664A)":"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize:13, fontWeight:checked?600:400, color:checked?"var(--teal,#18664A)":"var(--body,#253446)" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────── ESG tab ── */
function VendorESGOld({ toast }) {
  const [profile, setProfile]   = useState(null);
  const [existing, setExisting] = useState([]);
  const [step, setStep]         = useState(0); // 0=E, 1=S, 2=G, 3=review
  const [saving, setSaving]     = useState(false);

  // All numeric values stored as strings — converted to Number only on submit
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    carbon_emissions:"", renewable_energy_pct:"", ev_fleet_pct:"", waste_recycling_pct:"",
    biodegradable_packaging_pct:"", water_consumption:"", carbon_offset_programme: false,
    total_employees:"", women_employees_pct:"", women_leadership_pct:"", sc_st_obc_pct:"",
    pwd_employees_pct:"", jobs_created:"", jobs_marginalised:"", living_wage_compliance: false,
    health_insurance_pct:"", training_hours_per_emp:"", community_sourcing_pct:"",
    women_ownership_pct:"", women_board_pct:"", grievance_mechanism: false,
    avg_payment_days:"", annual_report_filed: false, data_privacy_policy: false,
    women_employed:"", carbon_saved:"", local_sourcing_pct:"", msme_certified: false,
  });

  useEffect(()=>{
    vendorAPI.getMyProfile().then(r=>{
      setProfile(r.data);
      vendorAPI.getESG(r.data.id).then(e=>setExisting(e.data)).catch(()=>{});
    }).catch(()=>{});
  },[]);

  const set = (field, val) => setForm(p=>({...p,[field]:val}));

  const save = async()=>{
    setSaving(true);
    try {
      const payload = { ...form };
      ["year","carbon_emissions","renewable_energy_pct","ev_fleet_pct","waste_recycling_pct","biodegradable_packaging_pct","water_consumption","total_employees","women_employees_pct","women_leadership_pct","sc_st_obc_pct","pwd_employees_pct","jobs_created","jobs_marginalised","health_insurance_pct","training_hours_per_emp","community_sourcing_pct","women_ownership_pct","women_board_pct","avg_payment_days","women_employed","carbon_saved","local_sourcing_pct"]
        .forEach(f=>{ payload[f] = Number(payload[f]) || 0; });
      const res = await vendorAPI.addESG(payload);
      toast.success(`ESG submitted! Score: ${res.data.score}/100 — ${res.data.band}`);
      if (profile) vendorAPI.getESG(profile.id).then(e=>setExisting(e.data)).catch(()=>{});
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSaving(false); }
  };

  // Shorthand wrappers — these are just calls, not component definitions
  const NF = (label, field, max, ph) =>
    <ESGNumField label={label} value={form[field]} onChange={v=>set(field,v)} max={max} placeholder={ph}/>;
  const BF = (label, field) =>
    <ESGBoolField label={label} checked={!!form[field]} onChange={v=>set(field,v)}/>;

  const steps = ["🌿 Environmental","👥 Social","🏛 Governance","Review & submit"];
  const stepColors = ["#18664A","#6384ff","#B8720A","var(--navy,#0B1D33)"];

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      {/* Latest score */}
      {existing.slice(0,1).map(e=>(
        <div key={e.id} style={{ background:"var(--navy,#0B1D33)", borderRadius:12, padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(242,235,217,.4)", marginBottom:4 }}>Latest ESG score {e.year&&`(${e.year})`}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:e.esg_score>=80?"#5FCFA0":e.esg_score>=60?"#F5B342":"#F5937F" }}>{e.esg_score}<span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"rgba(242,235,217,.4)", fontWeight:400 }}>/100</span></div>
            <div style={{ fontSize:12, color:"rgba(242,235,217,.55)", marginTop:2 }}>{e.esg_band}</div>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[{l:"E",v:e.e_score,m:30,c:"#5FCFA0"},{l:"S",v:e.s_score,m:45,c:"#818cf8"},{l:"G",v:e.g_score,m:25,c:"#fbbf24"}].map(p=>(
              <div key={p.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:p.c, fontFamily:"'Playfair Display',serif" }}>{p.v}</div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)" }}>{p.l}/{p.m}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Step tabs */}
      <div style={{ display:"flex", gap:0, background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:4, marginBottom:20, overflow:"auto" }}>
        {steps.map((s,i)=>(
          <button key={i} onClick={()=>setStep(i)} style={{ flex:1, padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background:step===i?stepColors[i]:"transparent", color:step===i?"white":"var(--muted,#67788D)", transition:"all .2s", whiteSpace:"nowrap" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"28px 32px", boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>

        {step === 0 && (<>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#18664A", marginBottom:4 }}>🌿 Environmental</div>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:20 }}>30% of total ESG score. Enter your environmental metrics for the current year.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
            <div style={{ paddingRight:16 }}>
              {NF("Carbon Emissions (tCO₂e/year)","carbon_emissions",undefined,"e.g. 12")}
              {NF("Renewable Energy (%)","renewable_energy_pct",100,"0 – 100")}
              {NF("EV / Non-motorised Fleet (%)","ev_fleet_pct",100,"0 – 100")}
              {NF("Water Consumption (litres/year)","water_consumption",undefined,"e.g. 50000")}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid var(--border,#D4C9B5)" }}>
              {NF("Waste Recycling Rate (%)","waste_recycling_pct",100,"0 – 100")}
              {NF("Biodegradable Packaging (%)","biodegradable_packaging_pct",100,"0 – 100")}
              {NF("Carbon Saved (tCO₂e)","carbon_saved",undefined,"e.g. 5")}
              <div style={{ marginTop:8 }}>
                {BF("Carbon Offset Programme in place","carbon_offset_programme")}
              </div>
            </div>
          </div>
        </>)}

        {step === 1 && (<>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#6384ff", marginBottom:4 }}>👥 Social</div>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:20 }}>45% of total ESG score — the most important pillar for ESP vendors.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
            <div style={{ paddingRight:16 }}>
              {NF("Total Employees","total_employees",undefined,"e.g. 25")}
              {NF("Women Employees (%)","women_employees_pct",100,"0 – 100")}
              {NF("Women in Leadership (%)","women_leadership_pct",100,"0 – 100")}
              {NF("Women Employed (count)","women_employed",undefined,"e.g. 18")}
              {NF("SC/ST/OBC Employees (%)","sc_st_obc_pct",100,"0 – 100")}
              {NF("PwD Employees (%)","pwd_employees_pct",100,"0 – 100")}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid var(--border,#D4C9B5)" }}>
              {NF("Jobs Created (last 12 months)","jobs_created",undefined,"e.g. 8")}
              {NF("Jobs for Marginalised Communities","jobs_marginalised",undefined,"e.g. 5")}
              {NF("Health Insurance Coverage (%)","health_insurance_pct",100,"0 – 100")}
              {NF("Training Hours per Employee/Year","training_hours_per_emp",undefined,"e.g. 12")}
              {NF("Community Sourcing (%)","community_sourcing_pct",100,"0 – 100")}
              <div style={{ marginTop:8 }}>
                {BF("Living Wage Compliance","living_wage_compliance")}
                {BF("MSME Certified","msme_certified")}
              </div>
            </div>
          </div>
        </>)}

        {step === 2 && (<>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#B8720A", marginBottom:4 }}>🏛 Governance</div>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:20 }}>25% of total ESG score. Governance and transparency metrics.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
            <div style={{ paddingRight:16 }}>
              {NF("Women Ownership (%)","women_ownership_pct",100,"0 – 100")}
              {NF("Women on Board/Management (%)","women_board_pct",100,"0 – 100")}
              {NF("Average Days to Pay Suppliers","avg_payment_days",undefined,"e.g. 30")}
              {NF("Local Sourcing (%)","local_sourcing_pct",100,"0 – 100")}
            </div>
            <div style={{ paddingLeft:16, borderLeft:"1px solid var(--border,#D4C9B5)" }}>
              <div style={{ marginTop:4 }}>
                {BF("Formal Grievance Mechanism","grievance_mechanism")}
                {BF("Annual Report / Audited Accounts Filed","annual_report_filed")}
                {BF("Data Privacy Policy in Place","data_privacy_policy")}
              </div>
            </div>
          </div>
        </>)}

        {step === 3 && (<>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:4 }}>Review & submit</div>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:20 }}>Your responses will be scored across Environmental, Social, and Governance pillars.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
            {[{l:"Environmental",fields:["renewable_energy_pct","waste_recycling_pct","ev_fleet_pct"],color:"#18664A",weight:"30%"},
              {l:"Social",fields:["women_employees_pct","health_insurance_pct","community_sourcing_pct"],color:"#6384ff",weight:"45%"},
              {l:"Governance",fields:["women_ownership_pct","women_board_pct"],color:"#B8720A",weight:"25%"}].map(p=>(
              <div key={p.l} style={{ padding:"16px", background:`${p.color}08`, border:`1px solid ${p.color}25`, borderRadius:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:6 }}>{p.l}</div>
                <div style={{ fontSize:11, color:"var(--muted,#67788D)" }}>Weight: {p.weight}</div>
                <div style={{ fontSize:12, color:"var(--body,#253446)", marginTop:8 }}>
                  {p.fields.map(f=>form[f]?`✓ ${f.replace(/_/g," ")}`:null).filter(Boolean).slice(0,2).map((x,i)=><div key={i}>{x}</div>)}
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={save} loading={saving} fullWidth size="lg">Submit ESG assessment →</Btn>
        </>)}
      </div>

      {/* Navigation */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:16 }}>
        {step > 0
          ? <Btn onClick={()=>setStep(s=>s-1)} variant="ghost" size="sm">← Previous</Btn>
          : <span/>}
        {step < 3
          ? <Btn onClick={()=>setStep(s=>s+1)} size="sm">Next →</Btn>
          : <span/>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Shared sub-components ── */

const ESG_SUPPORT_EMAIL = "contact@evencargo.in";
const ESG_SUPPORT_PHONE = "+91 93101 56985";

const ESG_EMPTY_FORM = {
  year: String(new Date().getFullYear()),
  carbon_emissions:"", renewable_energy_pct:"", ev_fleet_pct:"", waste_recycling_pct:"",
  biodegradable_packaging_pct:"", water_consumption:"", carbon_offset_programme:false,
  total_employees:"", women_employees_pct:"", women_leadership_pct:"", sc_st_obc_pct:"",
  pwd_employees_pct:"", jobs_created:"", jobs_marginalised:"", living_wage_compliance:false,
  health_insurance_pct:"", training_hours_per_emp:"", community_sourcing_pct:"",
  women_ownership_pct:"", women_board_pct:"", grievance_mechanism:false,
  avg_payment_days:"", annual_report_filed:false, data_privacy_policy:false,
  women_employed:"", carbon_saved:"", local_sourcing_pct:"", msme_certified:false,
};

const ESG_QUESTIONS = [
  { field:"renewable_energy_pct", pillar:"Environmental", weight:"up to 6 pts", type:"percent", title:"How much of your energy comes from renewable sources?", help:"Include solar, green grid power, renewable certificates, or other clean energy sources." },
  { field:"ev_fleet_pct", pillar:"Environmental", weight:"up to 4 pts", type:"percent", title:"What share of your delivery or operating fleet is EV or non-motorised?", help:"If you do not operate a fleet, choose 0% or I don't know." },
  { field:"waste_recycling_pct", pillar:"Environmental", weight:"up to 5 pts", type:"percent", title:"What percentage of operational waste is recycled or reused?", help:"Estimate from regular waste handling, vendor pickup, or internal records." },
  { field:"biodegradable_packaging_pct", pillar:"Environmental", weight:"up to 4 pts", type:"percent", title:"What percentage of your packaging is biodegradable or reusable?", help:"Use this for compostable, recycled, reusable, or low-plastic packaging." },
  { field:"carbon_offset_programme", pillar:"Environmental", weight:"3 pts", type:"bool", title:"Do you have a carbon offset or reduction programme?", help:"This can include tree plantation, verified offsets, or a documented emissions-reduction plan." },
  { field:"carbon_emissions", pillar:"Environmental", weight:"low emissions bonus", type:"number", title:"What are your annual carbon emissions?", unit:"tCO2e/year", placeholder:"e.g. 12", help:"If you have not measured this yet, choose I don't know and we can help calculate it." },
  { field:"water_consumption", pillar:"Environmental", weight:"tracked for impact", type:"number", title:"What is your annual water consumption?", unit:"litres/year", placeholder:"e.g. 50000", help:"A rough annual estimate is enough for now." },
  { field:"carbon_saved", pillar:"Environmental", weight:"impact metric", type:"number", title:"How much carbon have you saved through your operations?", unit:"tCO2e", placeholder:"e.g. 5", help:"Count savings from EV usage, recycling, renewable energy, or process improvements." },
  { field:"total_employees", pillar:"Social", weight:"context", type:"number", title:"How many people does your organisation currently employ?", unit:"employees", placeholder:"e.g. 25", help:"We prefill this from your profile team-size band when possible." },
  { field:"women_employees_pct", pillar:"Social", weight:"up to 12 pts", type:"percent", title:"What percentage of employees are women?", help:"This is one of the strongest social-impact scoring fields." },
  { field:"women_leadership_pct", pillar:"Social", weight:"up to 8 pts", type:"percent", title:"What percentage of leadership roles are held by women?", help:"Include founders, directors, managers, supervisors, or team leads." },
  { field:"women_employed", pillar:"Social", weight:"impact metric", type:"number", title:"How many women are employed by your organisation?", unit:"women employees", placeholder:"e.g. 18", help:"If you already gave the percentage, add the count if you know it." },
  { field:"sc_st_obc_pct", pillar:"Social", weight:"up to 3 pts", type:"percent", title:"What percentage of employees are from SC/ST/OBC communities?", help:"Use your HR or payroll records if available." },
  { field:"pwd_employees_pct", pillar:"Social", weight:"tracked for inclusion", type:"percent", title:"What percentage of employees are persons with disabilities?", help:"This helps buyers identify inclusive suppliers." },
  { field:"jobs_created", pillar:"Social", weight:"up to 5 pts", type:"number", title:"How many jobs did you create in the last 12 months?", unit:"jobs", placeholder:"e.g. 8", help:"Count net new jobs, including full-time, part-time, and stable contract roles." },
  { field:"jobs_marginalised", pillar:"Social", weight:"impact metric", type:"number", title:"How many new jobs supported marginalised communities?", unit:"jobs", placeholder:"e.g. 5", help:"Include women, SC/ST/OBC, PwD, low-income, rural, SHG, or similar groups." },
  { field:"living_wage_compliance", pillar:"Social", weight:"4 pts", type:"bool", title:"Do you pay at least living wage or statutory minimum wage?", help:"Choose Yes if your employees are paid fairly and legally across roles." },
  { field:"health_insurance_pct", pillar:"Social", weight:"up to 4 pts", type:"percent", title:"What percentage of employees have health insurance coverage?", help:"Include ESIC, group insurance, or company-supported health coverage." },
  { field:"training_hours_per_emp", pillar:"Social", weight:"up to 4 pts", type:"number", title:"How many training hours does each employee receive per year?", unit:"hours per employee/year", placeholder:"e.g. 12", help:"Include safety, skill, compliance, digital, or job-related training." },
  { field:"community_sourcing_pct", pillar:"Social", weight:"up to 5 pts", type:"percent", title:"What percentage of sourcing is local or community-based?", help:"This can include local suppliers, SHGs, artisans, farmer groups, or nearby MSMEs." },
  { field:"msme_certified", pillar:"Social", weight:"trust signal", type:"bool", title:"Are you MSME/Udyam certified?", help:"We prefill this if your profile certifications already include MSME/Udyam." },
  { field:"women_ownership_pct", pillar:"Governance", weight:"up to 8 pts", type:"percent", title:"What percentage of the business is women-owned?", help:"We use your profile ownership data if you have already provided it." },
  { field:"women_board_pct", pillar:"Governance", weight:"up to 5 pts", type:"percent", title:"What percentage of board or management roles are held by women?", help:"Include directors, partners, senior managers, and decision-makers." },
  { field:"grievance_mechanism", pillar:"Governance", weight:"3 pts", type:"bool", title:"Do you have a formal grievance or complaint mechanism?", help:"This can be an HR process, escalation contact, policy, or documented channel." },
  { field:"avg_payment_days", pillar:"Governance", weight:"payment-practice check", type:"number", title:"On average, how many days do you take to pay suppliers?", unit:"days", placeholder:"e.g. 30", help:"Faster supplier payments support better governance." },
  { field:"annual_report_filed", pillar:"Governance", weight:"3 pts", type:"bool", title:"Have annual reports or audited accounts been filed?", help:"This can include MCA filings, audited statements, or annual compliance records." },
  { field:"data_privacy_policy", pillar:"Governance", weight:"2 pts", type:"bool", title:"Do you have a data privacy or customer-data policy?", help:"Choose Yes if you have written rules for handling customer, employee, or buyer data." },
  { field:"local_sourcing_pct", pillar:"Governance", weight:"impact metric", type:"percent", title:"What percentage of procurement is locally sourced?", help:"Use this for nearby vendors, local raw materials, or India-based suppliers." },
];

const ESG_NUMERIC_FIELDS = [
  "year","carbon_emissions","renewable_energy_pct","ev_fleet_pct","waste_recycling_pct",
  "biodegradable_packaging_pct","water_consumption","total_employees","women_employees_pct",
  "women_leadership_pct","sc_st_obc_pct","pwd_employees_pct","jobs_created","jobs_marginalised",
  "health_insurance_pct","training_hours_per_emp","community_sourcing_pct","women_ownership_pct",
  "women_board_pct","avg_payment_days","women_employed","carbon_saved","local_sourcing_pct"
];

function profileESGDefaults(profile) {
  const defaults = {};
  const status = {};
  const certs = parseJSON(profile?.certification_types, []);
  if (certs.includes("msme_udyam")) {
    defaults.msme_certified = true;
    status.msme_certified = "answered";
  }
  if (profile?.is_women_owned) {
    defaults.women_ownership_pct = String(profile.women_ownership_percent || 51);
    status.women_ownership_pct = "answered";
  } else if (profile?.women_ownership_percent) {
    defaults.women_ownership_pct = String(profile.women_ownership_percent);
    status.women_ownership_pct = "answered";
  }
  if (profile?.team_size_band) {
    const teamMap = { "1-10":"5", "11-50":"25", "51-200":"100", "200+":"200" };
    if (teamMap[profile.team_size_band]) {
      defaults.total_employees = teamMap[profile.team_size_band];
      status.total_employees = "answered";
    }
  }
  return { defaults, status };
}

function ESGChoiceButton({ selected, children, onClick, tone = "var(--teal,#18664A)" }) {
  return (
    <button type="button" onClick={onClick}
      style={{ border:`1.5px solid ${selected?tone:"var(--border,#D4C9B5)"}`, background:selected?`${tone}12`:"white", color:selected?tone:"var(--body,#253446)", borderRadius:8, padding:"13px 14px", fontSize:13, fontWeight:selected?800:650, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", textAlign:"left", transition:"all .18s", minHeight:48 }}>
      {children}
    </button>
  );
}

function VendorESG({ toast }) {
  const [profile, setProfile] = useState(null);
  const [existing, setExisting] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [status, setStatus] = useState({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [form, setForm] = useState(ESG_EMPTY_FORM);

  useEffect(()=>{
    vendorAPI.getMyProfile().then(r=>{
      setProfile(r.data);
      vendorAPI.getESG(r.data.id).then(e=>setExisting(e.data)).catch(()=>{});
      const key = `esp_esg_draft_${r.data.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setForm({ ...ESG_EMPTY_FORM, ...(draft.form || {}) });
          setStatus(draft.status || {});
          setQIndex(Math.min(Math.max(Number(draft.qIndex) || 0, 0), ESG_QUESTIONS.length));
          setDraftRestored(true);
        } catch {
          const prefills = profileESGDefaults(r.data);
          setForm(p=>({ ...p, ...prefills.defaults }));
          setStatus(prefills.status);
        }
      } else {
        const prefills = profileESGDefaults(r.data);
        setForm(p=>({ ...p, ...prefills.defaults }));
        setStatus(prefills.status);
      }
      setHydrated(true);
    }).catch(()=>{ setHydrated(true); });
  },[]);

  useEffect(()=>{
    if (!hydrated || !profile?.id) return;
    localStorage.setItem(`esp_esg_draft_${profile.id}`, JSON.stringify({
      qIndex, form, status, updatedAt: new Date().toISOString()
    }));
  }, [hydrated, profile?.id, qIndex, form, status]);

  const current = ESG_QUESTIONS[qIndex];
  const isReview = qIndex >= ESG_QUESTIONS.length;
  const answeredCount = ESG_QUESTIONS.filter(q=>status[q.field] === "answered").length;
  const skippedCount = ESG_QUESTIONS.filter(q=>status[q.field] === "skipped").length;
  const touchedCount = answeredCount + skippedCount;
  const progressPct = Math.round((touchedCount / ESG_QUESTIONS.length) * 100);
  const skippedFields = ESG_QUESTIONS.filter(q=>status[q.field] === "skipped");
  const pillarColors = { Environmental:"#18664A", Social:"#6384ff", Governance:"#B8720A" };
  const percentOptions = [
    { label:"0%", value:"0" },
    { label:"1-25%", value:"25" },
    { label:"26-50%", value:"50" },
    { label:"51-75%", value:"75" },
    { label:"76-100%", value:"100" },
  ];

  const setAnswered = (field, val) => {
    setForm(p=>({...p,[field]:val}));
    setStatus(p=>({...p,[field]:"answered"}));
  };
  const answerAndAdvance = (field, val) => {
    setAnswered(field, val);
    window.setTimeout(()=>setQIndex(i=>Math.min(i+1, ESG_QUESTIONS.length)), 180);
  };
  const skipCurrent = () => {
    if (!current) return;
    setForm(p=>({...p,[current.field]: current.type === "bool" ? false : ""}));
    setStatus(p=>({...p,[current.field]:"skipped"}));
    setQIndex(i=>Math.min(i+1, ESG_QUESTIONS.length));
  };
  const goNext = () => setQIndex(i=>Math.min(i+1, ESG_QUESTIONS.length));
  const goPrev = () => setQIndex(i=>Math.max(i-1, 0));
  const supportMailto = `mailto:${ESG_SUPPORT_EMAIL}?subject=${encodeURIComponent("ESG data support")}&body=${encodeURIComponent("Hi Even Cargo team,\n\nI need help calculating ESG data for my vendor assessment.\n\nThanks.")}`;
  const supportTel = `tel:${ESG_SUPPORT_PHONE.replace(/\s/g, "")}`;

  const save = async()=>{
    setSaving(true);
    try {
      const payload = { ...form };
      ESG_NUMERIC_FIELDS.forEach(f=>{ payload[f] = Number(payload[f]) || 0; });
      const res = await vendorAPI.addESG(payload);
      toast.success(`ESG submitted! Score: ${res.data.score}/100 - ${res.data.band}`);
      if (profile?.id) localStorage.removeItem(`esp_esg_draft_${profile.id}`);
      const prefills = profileESGDefaults(profile);
      setForm({ ...ESG_EMPTY_FORM, ...prefills.defaults });
      setStatus(prefills.status);
      setQIndex(0);
      setDraftRestored(false);
      if (profile) vendorAPI.getESG(profile.id).then(e=>setExisting(e.data)).catch(()=>{});
      setSkipConfirmOpen(false);
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSaving(false); }
  };

  const submitFromReview = () => {
    if (skippedFields.length > 0) {
      setSkipConfirmOpen(true);
      return;
    }
    save();
  };

  const renderQuestionInput = () => {
    if (!current) return null;
    const tone = pillarColors[current.pillar] || "var(--teal,#18664A)";
    if (current.type === "bool") {
      return (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
          <ESGChoiceButton selected={status[current.field]==="answered" && form[current.field] === true} tone={tone} onClick={()=>answerAndAdvance(current.field, true)}>Yes</ESGChoiceButton>
          <ESGChoiceButton selected={status[current.field]==="answered" && form[current.field] === false} tone={tone} onClick={()=>answerAndAdvance(current.field, false)}>No</ESGChoiceButton>
          <ESGChoiceButton selected={status[current.field]==="skipped"} tone="#B8720A" onClick={skipCurrent}>I don't know</ESGChoiceButton>
        </div>
      );
    }
    if (current.type === "percent") {
      return (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
            {percentOptions.map(o=>(
              <ESGChoiceButton key={o.value} selected={status[current.field]==="answered" && String(form[current.field])===o.value} tone={tone} onClick={()=>answerAndAdvance(current.field, o.value)}>
                {o.label}
              </ESGChoiceButton>
            ))}
          </div>
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:11, fontWeight:800, color:"var(--muted,#67788D)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Or enter exact percentage</label>
            <input type="number" min="0" max="100" value={status[current.field]==="skipped" ? "" : form[current.field]}
              onChange={e=>setAnswered(current.field, e.target.value)}
              placeholder="0-100"
              style={{ width:"100%", padding:"13px 14px", fontSize:15, fontFamily:"'DM Sans',sans-serif", background:"var(--bg,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
          </div>
        </>
      );
    }
    return (
      <input type="number" min="0" value={status[current.field]==="skipped" ? "" : form[current.field]}
        onChange={e=>setAnswered(current.field, e.target.value)}
        placeholder={current.placeholder || "Enter value"}
        style={{ width:"100%", padding:"15px 16px", fontSize:16, fontFamily:"'DM Sans',sans-serif", background:"var(--bg,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
    );
  };

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      {existing.slice(0,1).map(e=>(
        <div key={e.id} style={{ background:"var(--navy,#0B1D33)", borderRadius:12, padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(242,235,217,.4)", marginBottom:4 }}>Latest ESG score {e.year&&`(${e.year})`}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:e.esg_score>=80?"#5FCFA0":e.esg_score>=60?"#F5B342":"#F5937F" }}>{e.esg_score}<span style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"rgba(242,235,217,.4)", fontWeight:400 }}>/100</span></div>
            <div style={{ fontSize:12, color:"rgba(242,235,217,.55)", marginTop:2 }}>{e.esg_band}</div>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[{l:"E",v:e.e_score,m:30,c:"#5FCFA0"},{l:"S",v:e.s_score,m:45,c:"#818cf8"},{l:"G",v:e.g_score,m:25,c:"#fbbf24"}].map(p=>(
              <div key={p.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:p.c, fontFamily:"'Playfair Display',serif" }}>{p.v}</div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)" }}>{p.l}/{p.m}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 20px", marginBottom:16, boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:14, alignItems:"flex-start", flexWrap:"wrap", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:".09em", textTransform:"uppercase", color:"var(--teal,#18664A)" }}>Guided ESG assessment</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)", marginTop:3 }}>
              {profile?.organization_name || "Your organisation"} ESG snapshot
            </div>
            <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>
              One question at a time. Unknown answers are allowed and saved in this browser until you submit.
            </div>
          </div>
          <div style={{ textAlign:"right", minWidth:160 }}>
            <div style={{ fontSize:24, fontWeight:800, color:"var(--teal,#18664A)", lineHeight:1 }}>{progressPct}%</div>
            <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:3 }}>{answeredCount} answered / {skippedCount} skipped</div>
          </div>
        </div>
        <div style={{ height:8, background:"var(--bg,#F2EBD9)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progressPct}%`, background:"linear-gradient(90deg,#18664A,#6384ff,#B8720A)", borderRadius:99, transition:"width .35s ease" }}/>
        </div>
        {draftRestored && (
          <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", fontSize:12, fontWeight:700 }}>
            Draft restored from this browser. Continue where you left off.
          </div>
        )}
      </div>

      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"28px 32px", boxShadow:"0 2px 12px rgba(11,29,51,.05)" }}>
        {!isReview && current && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:11, fontWeight:800, letterSpacing:".09em", textTransform:"uppercase", color:pillarColors[current.pillar] }}>{current.pillar} - Question {qIndex+1} of {ESG_QUESTIONS.length}</span>
              <span style={{ fontSize:11, fontWeight:800, color:"var(--muted,#67788D)", background:"var(--bg,#F2EBD9)", padding:"5px 9px", borderRadius:99 }}>{current.weight}</span>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, lineHeight:1.22, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:10 }}>{current.title}</div>
            <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.6, marginBottom:22, maxWidth:760 }}>{current.help}</p>
            {current.unit && <div style={{ fontSize:12, fontWeight:800, color:"var(--teal,#18664A)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>{current.unit}</div>}
            {renderQuestionInput()}
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginTop:18 }}>
              <Btn onClick={skipCurrent} variant="ghost" size="sm">I don't know</Btn>
              {status[current.field] === "skipped" && (
                <span style={{ fontSize:12, color:"var(--amber,#B8720A)" }}>
                  We'll calculate without this data. For help, contact <a href={supportMailto} style={{ color:"var(--amber,#B8720A)", fontWeight:800 }}>{ESG_SUPPORT_EMAIL}</a> or <a href={supportTel} style={{ color:"var(--amber,#B8720A)", fontWeight:800 }}>{ESG_SUPPORT_PHONE}</a>.
                </span>
              )}
            </div>
          </>
        )}

        {isReview && (
          <>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:6 }}>Review & submit</div>
            <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.6, marginBottom:20 }}>
              Your ESG score will be calculated from the answers available today. Skipped fields can be improved later.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
              {["Environmental","Social","Governance"].map(pillar=>{
                const qs = ESG_QUESTIONS.filter(q=>q.pillar===pillar);
                const done = qs.filter(q=>status[q.field]==="answered").length;
                const skip = qs.filter(q=>status[q.field]==="skipped").length;
                const color = pillarColors[pillar];
                return (
                  <div key={pillar} style={{ padding:"16px", background:`${color}08`, border:`1px solid ${color}25`, borderRadius:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color, marginBottom:8 }}>{pillar}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:"var(--navy,#0B1D33)", lineHeight:1 }}>{done}/{qs.length}</div>
                    <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:5 }}>{skip} marked I don't know</div>
                  </div>
                );
              })}
            </div>
            {skippedFields.length > 0 && (
              <div style={{ padding:"16px 18px", background:"var(--amber-bg,#FDF3E4)", border:"2px solid rgba(184,114,10,.35)", borderRadius:10, marginBottom:20, boxShadow:"0 10px 24px rgba(184,114,10,.10)" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--amber,#B8720A)", marginBottom:6 }}>Need help finding ESG data?</div>
                <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.55 }}>
                  {skippedFields.length} fields were skipped. We can help calculate or collect this data: <a href={supportMailto} style={{ color:"var(--amber,#B8720A)", fontWeight:800 }}>{ESG_SUPPORT_EMAIL}</a> / <a href={supportTel} style={{ color:"var(--amber,#B8720A)", fontWeight:800 }}>{ESG_SUPPORT_PHONE}</a>.
                </div>
              </div>
            )}
            <Btn onClick={submitFromReview} loading={saving} fullWidth size="lg">Submit ESG assessment -&gt;</Btn>
          </>
        )}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginTop:16 }}>
        {qIndex > 0
          ? <Btn onClick={goPrev} variant="ghost" size="sm">Previous</Btn>
          : <span/>}
        {!isReview
          ? <Btn onClick={goNext} size="sm">Next</Btn>
          : <span/>}
      </div>

      <Modal open={skipConfirmOpen} onClose={()=>setSkipConfirmOpen(false)} title="Submit with missing ESG data?" width={560}>
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ padding:"14px 16px", borderRadius:10, background:"var(--amber-bg,#FDF3E4)", border:"2px solid rgba(184,114,10,.35)" }}>
            <div style={{ fontSize:24, fontWeight:800, color:"var(--amber,#B8720A)", lineHeight:1 }}>{skippedFields.length}</div>
            <div style={{ fontSize:13, fontWeight:800, color:"var(--navy,#0B1D33)", marginTop:4 }}>
              questions were not answered
            </div>
          </div>
          <p style={{ fontSize:14, lineHeight:1.65, color:"var(--body,#253446)", margin:0 }}>
            Missing ESG data can materially lower your score and make your profile look less complete to buyers. That can reduce trust, weaken marketplace ranking, and may reduce service-request opportunities by up to 50% because buyers often filter for vendors with clearer ESG proof.
          </p>
          <p style={{ fontSize:13, lineHeight:1.55, color:"var(--muted,#67788D)", margin:0 }}>
            Even Cargo can help calculate these numbers from bills, payroll data, sourcing records, and policy documents.
          </p>
          <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginTop:4 }}>
            <Btn onClick={save} loading={saving} variant="ghost">Submit anyway</Btn>
            <a href={supportMailto}
              style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minHeight:42, padding:"0 18px", borderRadius:8, background:"var(--teal,#18664A)", border:"1.5px solid var(--teal,#18664A)", color:"white", textDecoration:"none", fontSize:13, fontWeight:800 }}>
              Contact us
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, hint, hintMsg }) {
  const [hovered, setHovered] = React.useState(false);
  const filled = Boolean(value);
  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"6px 0", borderBottom:"1px solid var(--border,#D4C9B5)" }}>
      <span style={{ fontSize:11, fontWeight:700, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".07em", minWidth:120, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color: filled ? "var(--navy,#0B1D33)" : "var(--muted,#67788D)", fontStyle: filled ? "normal" : "italic", flex:1 }}>{value || "Not added"}</span>
      {hint && (
        <div style={{ position:"relative", flexShrink:0 }}
          onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
          {filled
            ? <span style={{ fontSize:10, fontWeight:700, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"2px 7px", borderRadius:99, cursor:"default" }}>✓</span>
            : <span style={{ fontSize:10, fontWeight:700, color:"var(--amber,#B8720A)", background:"var(--amber-bg,#FDF3E4)", padding:"2px 7px", borderRadius:99, cursor:"default", whiteSpace:"nowrap" }}>{hint}</span>
          }
          {hovered && hintMsg && (
            <div style={{ position:"absolute", right:0, top:"120%", zIndex:50, background:"var(--navy,#0B1D33)", color:"white", fontSize:11, padding:"6px 10px", borderRadius:6, whiteSpace:"nowrap", boxShadow:"0 4px 12px rgba(0,0,0,.2)", pointerEvents:"none" }}>
              {filled ? `✓ Adds ${hint} to your profile score` : hintMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TagPicker({ label, options, selected, onChange, display, allowCustom=false, onAddCustom, showIcons=false }) {
  const [custom, setCustom] = useState("");
  const [adding, setAdding] = useState(false);
  const [customIcons, setCustomIcons] = useState({});
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x=>x!==v) : [...selected,v]);
  const addCustom = async () => {
    const value = custom.trim();
    if (!value || !onAddCustom) return;
    setAdding(true);
    try { const result=await onAddCustom(value); if(result?.name)setCustomIcons(p=>({...p,[result.name]:result.icon_key})); setCustom(""); } catch {} finally { setAdding(false); }
  };
  return (
    <div>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"var(--text3,#67788D)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {options.map(o=>{
          const sel = selected.includes(o);
          return (
            <button key={o} onClick={()=>toggle(o)}
              style={{ padding:"5px 12px", borderRadius:99, border:`1.5px solid ${sel?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, background:sel?"var(--teal-bg,#E4F2EB)":"white", color:sel?"var(--teal,#18664A)":"var(--body,#253446)", cursor:"pointer", fontSize:12, fontWeight:sel?600:400, fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
              <span style={{display:"inline-flex",alignItems:"center",gap:5}}>{showIcons&&<SectorIcon iconKey={customIcons[o]} name={o} size={15}/>} {display ? display(o) : o}</span>
            </button>
          );
        })}
      </div>
      {allowCustom && <div style={{ display:"flex", gap:7, marginTop:10 }}>
        <input value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}} placeholder="Type another sector"
          style={{ flex:1, padding:"8px 10px", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, fontFamily:"'DM Sans',sans-serif" }}/>
        <button type="button" onClick={addCustom} disabled={adding||!custom.trim()} style={{ border:"none", borderRadius:6, background:"var(--teal,#18664A)", color:"white", padding:"8px 12px", fontWeight:700, cursor:adding?"wait":"pointer" }}>{adding?"Adding...":"Add sector"}</button>
      </div>}
    </div>
  );
}

function AIBtn({ loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, cursor:loading?"wait":"pointer", display:"inline-flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
      {loading ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Generating…</> : <>Generate draft</>}
    </button>
  );
}

function VerifyResult({ result }) {
  return result ? (
    <div style={{ marginTop:8, padding:"10px 12px", background:result.success?"var(--teal-bg,#E4F2EB)":"var(--red-bg,#FAEBE8)", border:`1px solid ${result.success?"rgba(24,102,74,.2)":"rgba(184,66,50,.2)"}`, borderRadius:8, fontSize:13 }}>
      {result.success
        ? <div><span style={{ fontWeight:700, color:"var(--teal,#18664A)" }}>✓ Verified</span>{result.legal_name&&` — ${result.legal_name}`}{result.stub&&<span style={{ fontSize:11, color:"var(--amber,#B8720A)", marginLeft:8 }}>(stub mode)</span>}</div>
        : <span style={{ color:"var(--red,#B84232)" }}>{result.error}</span>}
    </div>
  ) : null;
}
