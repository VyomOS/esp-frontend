import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { apiErrorMessage, buyerAPI, vendorAPI, chatAPI, notificationAPI, resolveMediaUrl } from "../api/api";
import LocationAutocomplete from "../components/LocationAutocomplete";
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
const PROCUREMENT_INDUSTRIES = [
  { label:"Hospitals & Healthcare", category:"Healthcare & Wellness", count:"Hospitals, diagnostics, PPE, wellness", iconKey:"healthcare", bg:"#E8F1FF", color:"#2563EB", terms:["medical","clinic","hospital","health","wellness","diagnostic","ppe","nurse","pharma"] },
  { label:"Automotive", category:"Logistics & Delivery", count:"Fleet, EV, drivers", iconKey:"automotive", bg:"#FFF0E6", color:"#EA580C", terms:["vehicle","fleet","auto","automotive","driver","spare","parts","ev","delivery"] },
  { label:"ITES", category:"IT & Digital Services", count:"Tech, support, BPO", iconKey:"technology", bg:"#F1EAFE", color:"#7C3AED", terms:["software","website","app","bpo","call center","data","tech","support","digital"] },
  { label:"Gifting", category:"Handicrafts & Artisan", count:"Hampers, merchandise", iconKey:"gifting", bg:"#FCE7F3", color:"#DB2777", terms:["gift","gifting","hamper","merchandise","festival","corporate gift","souvenir"] },
  { label:"Food", category:"Food & Catering", count:"Meals, pantry, catering", iconKey:"food", bg:"#ECFDF5", color:"#059669", terms:["food","catering","snacks","meals","canteen","beverage","lunch","kitchen"] },
];
const QUICK_REQUIREMENTS = [
  { title:"Office meals & catering", meta:"Food vendors, canteen, packed meals", category:"Food & Catering", query:"office meals catering", tag:"Most requested" },
  { title:"Corporate gifting", meta:"Hampers, merchandise, artisan products", category:"Handicrafts & Artisan", query:"corporate gifting hampers", tag:"Festive" },
  { title:"Last-mile delivery", meta:"Fleet, EV delivery, logistics partners", category:"Logistics & Delivery", query:"last mile delivery logistics", tag:"Fast quotes" },
  { title:"Facility cleaning", meta:"Housekeeping, hygiene, facility support", category:"Facilities & Cleaning", query:"facility cleaning housekeeping", tag:"Verified" },
  { title:"IT support services", meta:"Software, support, digital operations", category:"IT & Digital Services", query:"IT support services", tag:"Remote ready" },
];
const CERT_TYPES = ["women_led","msme_udyam","sc_st_owned","shg","social_enterprise","cooperative","fair_trade","weps_signatory"];
const BID_COLOR  = { submitted:"var(--teal,#18664A)", under_review:"var(--amber,#B8720A)", shortlisted:"#6384ff", awarded:"var(--teal,#18664A)", declined:"var(--red,#B84232)" };
const BID_ICON   = { submitted:"📨", under_review:"👀", shortlisted:"⭐", awarded:"🏆", declined:"✗" };

/* ─────────────────────────────────── helpers ── */
const userName = () => localStorage.getItem("name") || "there";
function fixNotifLink(link, category) {
  const map = { "/dashboard/my-bids":"/dashboard/requests", "/dashboard/my-requests":"/dashboard/requests", "/dashboard/documents":"/dashboard", "/dashboard/profile":"/dashboard" };
  const resolved = link ? (map[link] || link) : null;
  if (resolved) return resolved;
  if (category === "bid") return "/dashboard/requests";
  return null;
}
function parseJSON(val, fallback = []) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return fallback; }
}
function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
function procurementSuggestions(query) {
  const q = query.toLowerCase();
  if (wordCount(query) < 3) return [];
  return PROCUREMENT_INDUSTRIES
    .map(ind => {
      const hits = ind.terms.filter(t => q.includes(t)).length;
      return { ...ind, hits };
    })
    .filter(ind => ind.hits > 0)
    .sort((a,b)=>b.hits-a.hits)
    .slice(0,3);
}
function detectProcurementIndustry(query) {
  return PROCUREMENT_INDUSTRIES
    .map(ind => ({ ...ind, hits: ind.terms.filter(t => query.toLowerCase().includes(t)).length }))
    .filter(ind => ind.hits > 0)
    .sort((a,b)=>b.hits-a.hits)[0] || null;
}
function searchableVendorText(v) {
  return [
    v.name, v.organization_name, v.category, v.service_categories,
    v.certification_types, v.location, v.description, v.esg_band,
  ].filter(Boolean).join(" ").toLowerCase();
}
function queryTerms(query) {
  return query.toLowerCase().split(/\s+/).map(t => t.replace(/[^a-z0-9&]/g, "")).filter(t => t.length >= 3);
}

/* ─────────────────────────────────── Main router ── */
export default function BuyerDashboard() {
  const loc  = useLocation();
  const nav  = useNavigate();
  const toast = useToast();
  const tab = loc.pathname.includes("requests") ? "requests"
    : loc.pathname.includes("vendors")           ? "vendors"
    : "home";

  useEffect(()=>{
    if (tab === "home" && sessionStorage.getItem("espServiceIntent")) nav("/dashboard/requests");
  }, [tab, nav]);

  return (
    <Layout>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"1.5px solid var(--border,#D4C9B5)", marginBottom:28, flexWrap:"wrap" }}>
        {[
          { id:"home",     label:"Home",          icon:"home" },
          { id:"requests", label:"My RFPs",        icon:"clipboard" },
          { id:"vendors",  label:"Find Vendors",   icon:"search" },
        ].map(t=>{
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={()=>nav(t.id==="home"?"/dashboard":`/dashboard/${t.id}`)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:active?"var(--navy,#0B1D33)":"var(--text3,#67788D)", borderBottom:`2px solid ${active?"var(--teal,#18664A)":"transparent"}`, marginBottom:"-1.5px", transition:"all .16s" }}>
              <span style={{ display:"flex" }}><SectorIcon iconKey={t.icon} size={16}/></span>{t.label}
            </button>
          );
        })}
      </div>

      {tab === "home"     && <BuyerHome toast={toast} nav={nav}/>}
      {tab === "requests" && <BuyerRequests toast={toast} nav={nav}/>}
      {tab === "vendors"  && <BuyerVendors toast={toast}/>}
    </Layout>
  );
}

/* ─────────────────────────────────── HOME tab ── */
function BuyerHome({ toast, nav }) {
  const [reqs, setReqs]     = useState([]);
  const [vendors, setVendors] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [aiSuggs, setAiSuggs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procurementQuery, setProcurementQuery] = useState("");
  const [activeIndustry, setActiveIndustry] = useState("");
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [locationInput, setLocationInput] = useState("");
  const [locationKey, setLocationKey] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [popularFacts, setPopularFacts] = useState([]);

  useEffect(()=>{
    buyerAPI.getMyProfile().catch(()=>({data:null})).then(profileResponse=>{
      const profile = profileResponse.data;
      setBuyerProfile(profile);
      setLocationInput(profile?.location || "");
      setLocationKey(profile?.location_key || "");
      return Promise.allSettled([
        buyerAPI.getMyRequests(), vendorAPI.getRanked(profile?.location?{location:profile.location}:undefined),
        notificationAPI.getAll({ unread_only: true, limit: 3 }), buyerAPI.marketplacePopular(),
      ]);
    }).then(([r,v,n,popular])=>{
      const requests = r.status==="fulfilled" ? r.value.data : [];
      const ranked   = v.status==="fulfilled" ? v.value.data : [];
      setReqs(requests);
      setVendors(ranked.slice(0,4));
      if (n.status==="fulfilled") setNotifs((n.value.data.notifications || n.value.data || []).slice(0,3));
      if (popular.status==="fulfilled") setPopularFacts(popular.value.data.facts || []);

      // Fetch AI suggestions from dedicated endpoint
      buyerAPI.aiSuggestions({ requests, recent_activity: [] })
        .then(res => setAiSuggs(res.data.suggestions || []))
        .catch(() => setAiSuggs(buildBuyerSuggestions(requests)));
    }).finally(()=>setLoading(false));
  },[]);

  const saveBuyerLocation = async () => {
    const location = locationInput.trim();
    if (!location || !locationKey) { toast.error("Choose a recommended city and state"); return; }
    setSavingLocation(true);
    try {
      await buyerAPI.createProfile({ location, location_key: locationKey });
      setBuyerProfile(profile=>({...profile,location,location_key:locationKey}));
      const ranked = await vendorAPI.getRanked({ location });
      setVendors((ranked.data||[]).slice(0,4));
      toast.success("Location saved. Same-area suppliers are shown first.");
    } catch (err) { toast.error(apiErrorMessage(err, "Could not save location")); }
    finally { setSavingLocation(false); }
  };

  const active     = reqs.filter(r=>r.status==="active");
  const totalBids  = reqs.reduce((s,r)=>s+(r.bid_count||0),0);
  const unreviewed = reqs.filter(r=>r.status==="active" && (r.bid_count||0)>0).length;
  const liveSuggestions = procurementSuggestions(procurementQuery);
  const selectedIndustry = PROCUREMENT_INDUSTRIES.find(i => i.label === activeIndustry);
  const startProcurementSearch = (query = procurementQuery, industry = selectedIndustry) => {
    const clean = query.trim();
    const detected = industry || detectProcurementIndustry(clean);
    if (clean) sessionStorage.setItem("buyerProcurementQuery", clean);
    if (detected?.category) sessionStorage.setItem("buyerProcurementCategory", detected.category);
    nav("/dashboard/vendors");
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:80, borderRadius:12}}/>)}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22, animation:"fadeUp .4s ease" }}>
      <div style={{ background:"#fff", border:"1px solid #E2E7EE", borderRadius:8, overflow:"hidden", boxShadow:"0 1px 8px rgba(11,29,51,.06)" }}>
        <div style={{ padding:"22px 24px 18px", borderBottom:"1px solid #E6EAF0", background:"#F8FAFC" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:18, alignItems:"flex-start", marginBottom:18, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:5 }}>Hi {userName().split(" ")[0]}, find suppliers for your next purchase.</div>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:26, fontWeight:800, color:"#0F172A", lineHeight:1.18, letterSpacing:0 }}>What do you want to procure today?</h1>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(78px,1fr))", gap:8, minWidth:270 }}>
            {[{val:active.length,label:"Open RFPs"},{val:totalBids,label:"Quotes"},{val:vendors.length,label:"Suppliers"}].map(s=>(
              <div key={s.label} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:7, padding:"10px 12px" }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#0F172A", lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, color:"#64748B", textTransform:"uppercase", letterSpacing:".05em", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:"#fff", border:"1.5px solid #CBD5E1", borderRadius:7, padding:"8px", flexWrap:"wrap" }}>
          <input value={procurementQuery} onChange={e=>setProcurementQuery(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") startProcurementSearch(); }}
            placeholder="Search: catering, logistics, gifts, IT support..."
            style={{ flex:1, border:"none", outline:"none", background:"transparent", color:"#0F172A", fontSize:15, fontFamily:"'DM Sans',sans-serif", minWidth:260, padding:"7px 8px" }}/>
          <button onClick={()=>startProcurementSearch()} style={{ background:"#18664A", color:"white", border:"none", borderRadius:6, padding:"11px 18px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Search suppliers</button>
        </div>
        </div>
        <div style={{ padding:"16px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, gap:10 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>Shop by category</div>
          <button onClick={()=>nav("/dashboard/vendors")} style={{ background:"none", border:"none", color:"#18664A", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>All suppliers</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))", gap:10 }}>
          {PROCUREMENT_INDUSTRIES.map(ind=>{
            const activeChip = activeIndustry === ind.label;
            return (
              <button key={ind.label} onClick={()=>{ setActiveIndustry(ind.label); setProcurementQuery(q => q || ind.label); startProcurementSearch(ind.label, ind); }}
                style={{ background:activeChip?ind.bg:"#fff", border:`1.5px solid ${activeChip?ind.color:"#E2E8F0"}`, borderRadius:12, padding:"14px 12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"center", minHeight:150, boxShadow:"0 3px 12px rgba(15,23,42,.05)", transition:"transform .16s, box-shadow .16s" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(15,23,42,.10)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 3px 12px rgba(15,23,42,.05)";}}>
                <div style={{ width:66, height:66, borderRadius:18, background:ind.bg, color:ind.color, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 11px", boxShadow:`inset 0 0 0 1px ${ind.color}20` }}><SectorIcon iconKey={ind.iconKey} size={38}/></div>
                <div style={{ fontSize:13, fontWeight:800, color:"#0F172A", lineHeight:1.25 }}>{ind.label}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:4, lineHeight:1.35 }}>{ind.count}</div>
              </button>
            );
          })}
        </div>
        </div>
        {liveSuggestions.length > 0 && (
          <div style={{ borderTop:"1px solid #E2E8F0", overflow:"hidden" }}>
            {liveSuggestions.map((s,i)=>(
              <button key={s.label} onClick={()=>startProcurementSearch(procurementQuery, s)}
                style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, padding:"12px 18px", background:i%2===0?"white":"#F8FAFC", border:"none", borderBottom:i<liveSuggestions.length-1?"1px solid #E2E8F0":"none", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
                <span>
                  <span style={{ display:"block", fontSize:13, fontWeight:800, color:"#0F172A" }}>{s.label}</span>
                  <span style={{ display:"block", fontSize:12, color:"#64748B", marginTop:2 }}>Category match: {s.category}</span>
                </span>
                <span style={{ fontSize:12, fontWeight:800, color:"#18664A" }}>View suppliers</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Hero ── */}
      <div style={{ background:buyerProfile?.location?"#ECFDF5":"#FFF7ED", border:`1px solid ${buyerProfile?.location?"#A7F3D0":"#FED7AA"}`, borderRadius:8, padding:"13px 16px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:210 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>{buyerProfile?.location?`Same-area suppliers first: ${buyerProfile.location}`:"Where are you procuring from?"}</div>
          <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>Location is used as an area match, not a distance radius.</div>
        </div>
        <LocationAutocomplete className="dashboard-location-picker" value={locationInput} selectedKey={locationKey} label="City or PIN" onSelect={item=>{setLocationInput(item.profile_location);setLocationKey(item.key);}} onClear={()=>setLocationKey("")} />
        <button onClick={saveBuyerLocation} disabled={savingLocation || !locationKey} style={{ background:"#18664A", color:"white", border:"none", borderRadius:6, padding:"10px 14px", fontSize:12, fontWeight:800, cursor:savingLocation?"wait":"pointer" }}>{savingLocation?"Saving...":"Save location"}</button>
      </div>

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>Popular requirements</div>
            <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Live platform activity; 30-day values are labelled</div>
          </div>
          <button onClick={()=>nav("/dashboard/vendors")} style={{ background:"none", border:"none", color:"#18664A", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>View all suppliers</button>
        </div>
        {popularFacts.length>0 && <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>{popularFacts.map(f=><span key={f.label} style={{ fontSize:11, color:"#475569", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:99, padding:"5px 9px" }}><strong style={{ color:"#0F172A" }}>{f.value}</strong> {f.label.toLowerCase()}</span>)}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
          {QUICK_REQUIREMENTS.map(item=>(
            <button key={item.title} onClick={()=>startProcurementSearch(item.query, { category:item.category })}
              style={{ textAlign:"left", background:"#fff", border:"1px solid #E2E8F0", borderRadius:7, padding:"14px 15px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 1px 6px rgba(11,29,51,.04)", minHeight:112 }}>
              <span style={{ display:"inline-flex", fontSize:10, fontWeight:900, color:"#B8720A", background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:99, padding:"3px 8px", marginBottom:10 }}>{item.tag}</span>
              <div style={{ color:"#18664A", marginBottom:6 }}><SectorIcon iconKey={sectorIconKey(item.category)} size={24}/></div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:5 }}>{item.title}</div>
              <div style={{ fontSize:12, color:"#64748B", lineHeight:1.45 }}>{item.meta}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"none", background:"var(--navy,#0B1D33)", borderRadius:16, padding:"32px 36px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-60, top:-60, width:240, height:240, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:10 }}>Buyer dashboard</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:700, color:"var(--cream,#F2EBD9)", lineHeight:1.25, marginBottom:10 }}>
            Good {new Date().getHours()<12?"morning":"afternoon"}, {userName().split(" ")[0]}.
          </h1>
          <p style={{ fontSize:13, color:"rgba(242,235,217,.55)", lineHeight:1.6, marginBottom:24, maxWidth:420 }}>
            {active.length === 0 ? "Post your first RFP to start receiving bids from verified, ESG-scored vendors."
              : unreviewed > 0 ? `You have ${unreviewed} active RFP${unreviewed>1?"s":""} with bids waiting for your review.`
              : "Your procurement pipeline is running. Browse new vendor matches below."}
          </p>
          {/* Stats */}
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              { val: active.length,   label:"Active RFPs",     color:"#5FCFA0" },
              { val: totalBids,       label:"Bids received",   color:"var(--cream,#F2EBD9)" },
              { val: vendors.length,  label:"Verified vendors",color:"#F5B342" },
            ].map(s=>(
              <div key={s.label}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:10, color:"rgba(242,235,217,.4)", textTransform:"uppercase", letterSpacing:".07em", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI suggestions ── */}
      {false && aiSuggs.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontSize:14 }}>✨</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>What needs your attention</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {aiSuggs.map(s=>(
              <div key={s.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 2px 12px rgba(11,29,51,.06)" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55 }}>{s.body}</div>
                </div>
                <button onClick={()=>nav((s.tab||s.action_tab||"home")==="home"?"/dashboard":`/dashboard/${s.tab||s.action_tab}`)}
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

      {/* ── Active RFPs preview ── */}
      {active.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>📋</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Active RFPs</span>
            </div>
            <button onClick={()=>nav("/dashboard/requests")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif" }}>Manage all →</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {active.slice(0,4).map(r=>(
              <div key={r.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{r.title}</div>
                  <div style={{ fontSize:12, color:"var(--muted,#67788D)" }}>
                    {r.category && <span>{r.category} · </span>}
                    {r.deadline && <span>Due {new Date(r.deadline).toLocaleDateString()} · </span>}
                    <span>{r.bid_count||0} bid{r.bid_count!==1?"s":""}</span>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                  {(r.bid_count||0) > 0 && (
                    <span style={{ background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
                      {r.bid_count} bid{r.bid_count!==1?"s":""}
                    </span>
                  )}
                  <button onClick={()=>nav("/dashboard/requests")} style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"6px 12px", fontSize:12, fontWeight:600, color:"var(--navy,#0B1D33)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && (
        <div style={{ background:"white", border:"1.5px dashed var(--border,#D4C9B5)", borderRadius:14, padding:"36px", textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:.4 }}>📋</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:6 }}>No active RFPs yet</div>
          <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:20 }}>Post a requirement and receive bids from verified, ESG-scored vendors.</div>
          <button onClick={()=>nav("/dashboard/requests")} style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Post your first RFP →
          </button>
        </div>
      )}

      {/* ── Vendor spotlight ── */}
      {vendors.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>🌱</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Top verified vendors</span>
            </div>
            <button onClick={()=>nav("/dashboard/vendors")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", fontFamily:"'DM Sans',sans-serif" }}>Browse all →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {vendors.map((v,i)=>(
              <div key={v.vendor_id||v.id} style={{ background:"white", border:`1px solid ${i===0?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"16px 18px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
                {i===0 && <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal,#18664A)", marginBottom:8 }}>🏆 Top ranked</div>}
                <div style={{ fontSize:14, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:4 }}>{v.name||v.organization_name}</div>
                {v.location && <div style={{ fontSize:12, color:"var(--muted,#67788D)", marginBottom:6 }}>📍 {v.location}</div>}
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:v.esg_score>=80?"var(--teal,#18664A)":v.esg_score>=60?"var(--amber,#B8720A)":"var(--red,#B84232)", background:"var(--cream,#F2EBD9)", padding:"2px 8px", borderRadius:99 }}>
                    ESG {v.esg_score||0}/100
                  </span>
                  {v.is_women_owned && <span style={{ fontSize:10, fontWeight:700, color:"#db2777", background:"rgba(244,114,182,.1)", padding:"2px 8px", borderRadius:99 }}>Women-led</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
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
                  <div style={{ fontSize:13, color:"var(--navy,#0B1D33)", lineHeight:1.55 }}>{n.message}</div>
                  <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:3 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {dest && <span style={{ fontSize:12, color:"var(--teal,#18664A)", flexShrink:0, alignSelf:"center" }}>→</span>}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── AI suggestion builder ── */
function buildBuyerSuggestions(requests) {
  const active    = requests.filter(r=>r.status==="active");
  const withBids  = active.filter(r=>(r.bid_count||0)>0);
  const suggs     = [];

  if (requests.length === 0)
    suggs.push({ id:"first-rfp", icon:"📋", title:"Post your first RFP",
      fallback:"Verified vendors on ESP are waiting to bid. Post a requirement in under 2 minutes.",
      prompt:"Write a 20-word reason for a procurement buyer to post their first RFP on an ESG marketplace. Be encouraging and specific.",
      action:"Post RFP", tab:"requests" });

  if (withBids.length > 0)
    suggs.push({ id:"review-bids", icon:"📨", title:`${withBids.length} RFP${withBids.length>1?"s":""}  ha${withBids.length>1?"ve":"s"} bids to review`,
      fallback:`${withBids.reduce((s,r)=>s+(r.bid_count||0),0)} vendor proposals are waiting. Review and shortlist before deadlines close.`,
      prompt:`Write a 20-word urgency message for a buyer who has ${withBids.length} procurement requests with unreviewed vendor bids. Professional tone.`,
      action:"Review bids", tab:"requests" });

  if (active.length > 0 && withBids.length === 0)
    suggs.push({ id:"no-bids", icon:"⏳", title:"Your RFPs haven't received bids yet",
      fallback:"Share your RFPs with your network or lower the minimum ESG score to attract more vendors.",
      prompt:"Write a 20-word helpful tip for a buyer whose open RFPs have received no bids yet. Suggest one action.",
      action:"View RFPs", tab:"requests" });

  if (requests.length > 0 && requests.filter(r=>r.min_esg_score===0||!r.min_esg_score).length > 0)
    suggs.push({ id:"add-esg", icon:"🌱", title:"Set ESG requirements on your RFPs",
      fallback:"Adding a minimum ESG score signals your commitment to responsible procurement and surfaces better-matched vendors.",
      prompt:"Write a 20-word reason for a buyer to set minimum ESG score requirements on their procurement RFPs. BRSR angle.",
      action:"Update RFP", tab:"requests" });

  return suggs.slice(0,3);
}

/* ─────────────────────────────────── REQUEST CARD (module-level — prevents focus loss) ── */
function RequestCard({ req, onViewBids, onAiMatch, onClose, onReopen, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = req.status==="active" ? "var(--teal,#18664A)" : req.status==="closed" ? "var(--muted,#67788D)" : "var(--amber,#B8720A)";

  return (
    <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, overflow:"hidden", boxShadow:"0 2px 10px rgba(11,29,51,.05)" }}>
      {/* Header */}
      <div style={{ padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{req.title}</span>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", background:`${statusColor}15`, color:statusColor, padding:"2px 8px", borderRadius:99 }}>
                {req.status}
              </span>
            </div>
            <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:8 }}>{req.description?.slice(0,120)}{req.description?.length>120?"…":""}</div>
            <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
              {req.category && <span>📂 {req.category}</span>}
              {req.budget   && <span>💰 {req.budget}</span>}
              {req.deadline && <span>📅 {new Date(req.deadline).toLocaleDateString()}</span>}
              {req.location && <span>📍 {req.location}</span>}
              {req.min_esg_score > 0 && <span style={{ color:"var(--teal,#18664A)" }}>🌱 Min ESG: {req.min_esg_score}</span>}
            </div>
            {req.impact_requirements && (
              <div style={{ marginTop:8, fontSize:12, padding:"6px 10px", background:"var(--teal-bg,#E4F2EB)", borderRadius:6, color:"var(--teal,#18664A)" }}>
                🌱 {req.impact_requirements}
              </div>
            )}
          </div>
          {(req.bid_count||0) > 0 && (
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"var(--teal,#18664A)", lineHeight:1 }}>{req.bid_count}</div>
              <div style={{ fontSize:10, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".06em" }}>bid{req.bid_count!==1?"s":""}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", paddingTop:12, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          {req.status==="active" && (
            <>
              <button onClick={()=>{ onViewBids(req); setExpanded(true); }}
                style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--teal,#18664A)"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--navy,#0B1D33)"}>
                View bids ({req.bid_count||0})
              </button>
              <button onClick={()=>onAiMatch(req.id)}
                style={{ background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Find matching suppliers
              </button>
              <button onClick={()=>onClose(req.id)}
                style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"7px 12px", fontSize:12, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Close
              </button>
            </>
          )}
          {(req.status==="closed"||req.status==="completed") && (
            <button onClick={()=>onReopen(req.id)}
              style={{ background:"var(--teal-bg,#E4F2EB)", color:"var(--teal,#18664A)", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              ↺ Reopen
            </button>
          )}
          <button onClick={()=>onDelete(req.id)}
            style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"7px 12px", fontSize:12, fontWeight:600, color:"var(--red,#B84232)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── REQUESTS tab ── */
function BuyerRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ title:"", description:"", category:"", location:"", budget:"", deadline:"", impact_requirements:"", min_esg_score:"" });
  const [saving, setSaving]     = useState(false);
  const [genLoading, setGenLoading] = useState("");
  // Bid management
  const [bidsModal, setBidsModal] = useState(null);
  const [bids, setBids]           = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  // AI match
  const [aiModal, setAiModal]     = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Vendor detail (from bid card click)
  const [vendorDetailData, setVendorDetailData]     = useState(null);
  const [vendorDetailLoading, setVendorDetailLoading] = useState(false);
  const [vendorDetailName, setVendorDetailName]     = useState("");
  const [showBidVendorContact, setShowBidVendorContact] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  // Confirms
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClose, setConfirmClose]   = useState(null);
  const [confirmReopen, setConfirmReopen] = useState(null);
  const [confirmAward, setConfirmAward]   = useState(null); // {bidId, vendorName}
  const [awarding, setAwarding]           = useState(false);

  useEffect(()=>{
    try {
      const intent = JSON.parse(sessionStorage.getItem("espServiceIntent") || "null");
      if (!intent || intent.version !== 1 || Date.now() - intent.created_at > 24 * 60 * 60 * 1000) return;
      setForm(previous=>({
        ...previous,
        title: intent.title || previous.title,
        category: intent.category || previous.category,
        description: `I would like a quote and availability details for ${intent.title}.`,
        service_id: intent.service_id,
        target_vendor_id: intent.vendor_id,
      }));
      setCreating(true);
    } catch { sessionStorage.removeItem("espServiceIntent"); }
  }, []);

  const load = () => buyerAPI.getMyRequests().then(r=>setRequests(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const create = async () => {
    if (!form.title.trim() || !form.category) { toast.error("Title and category are required"); return; }
    setSaving(true);
    try {
      await buyerAPI.createRequest({ ...form, min_esg_score: Number(form.min_esg_score)||0 });
      sessionStorage.removeItem("espServiceIntent");
      toast.success("RFP posted!");
      setCreating(false);
      setForm({ title:"", description:"", category:"", location:"", budget:"", deadline:"", impact_requirements:"", min_esg_score:"" });
      load();
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSaving(false); }
  };

  const aiGenerate = async (field) => {
    if (!form.title || !form.category) { toast.error("Enter title and category first"); return; }
    setGenLoading(field);
    try {
      const r = await buyerAPI.aiRfpDraft({
        title: form.title, category: form.category,
        budget: form.budget, location: form.location,
        deadline: form.deadline,
      });
      if (field === "description")
        setForm(p=>({...p, description: r.data.description||""}));
      else
        setForm(p=>({...p, impact_requirements: r.data.impact_requirements||""}));
    } catch { toast.error("AI unavailable — write it manually!"); }
    finally { setGenLoading(""); }
  };

  const viewBids = async (req) => {
    setBidsModal(req); setBids([]); setBidsLoading(true); setAiSummary("");
    try {
      const res = await buyerAPI.getBidsOnRequest(req.id);
      setBids(res.data);
      // AI bid comparison if 3+ bids — use dedicated endpoint
      if (res.data.length >= 3) {
        buyerAPI.aiBidComparison({ rfp_id: req.id })
          .then(r => {
            const d = r.data;
            const summary = d.summary || "";
            const rec = d.ranked?.[0];
            const recText = rec ? ` Recommended: bid #${rec.bid_id} — ${rec.reason}` : "";
            setAiSummary(summary + recText);
          })
          .catch(() => {});
      }
    } catch { toast.error("Failed to load bids"); }
    finally { setBidsLoading(false); }
  };

  const updateBid = (bidId, status) => {
    if (status === "awarded") {
      const bid = bids.find(b => b.id === bidId);
      setConfirmAward({ bidId, vendorName: bid?.vendor_name || "this vendor" });
      return;
    }
    buyerAPI.updateBidStatus(bidId, { status, buyer_note: "" })
      .then(() => { toast.success(`Bid ${status.replace(/_/g," ")}`); viewBids(bidsModal); })
      .catch(() => toast.error("Failed"));
  };

  const handleAward = async () => {
    if (!confirmAward) return;
    setAwarding(true);
    try {
      await buyerAPI.updateBidStatus(confirmAward.bidId, { status:"awarded", buyer_note:"" });
      await buyerAPI.closeRequest(bidsModal.id, { close_reason:"Contract awarded" });
      toast.success(`Contract awarded to ${confirmAward.vendorName}. RFP closed.`);
      setConfirmAward(null);
      setBidsModal(null);
      setBids([]);
      setAiSummary("");
      load();
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setAwarding(false); }
  };

  const getAiMatch = async (id) => {
    setAiModal(id); setAiResults(null); setAiLoading(true);
    try {
      const r = await buyerAPI.aiVendorMatches(id, 4);
      const matches = Array.isArray(r.data) ? r.data.map(m => ({
        vendor_id:   m.vendor?.id || m.vendor?.vendor_id,
        vendor_name: m.vendor?.organization_name || m.vendor?.name,
        location:    m.vendor?.location,
        esg_score:   m.vendor?.esg_score,
        esg_band:    m.vendor?.esg_band,
        is_women_owned: m.vendor?.is_women_owned,
        score:  m.match_score,
        reason: m.match_reason,
      })) : [];
      setAiResults(matches);
    }
    catch { toast.error("AI matching failed"); setAiResults([]); }
    finally { setAiLoading(false); }
  };

  const openBidVendor = async (vendorId, name) => {
    setVendorDetailName(name); setVendorDetailData(null); setVendorDetailLoading(true); setShowBidVendorContact(false);
    try {
      const [p,e,r] = await Promise.allSettled([vendorAPI.getVendor(vendorId), vendorAPI.getESG(vendorId), buyerAPI.getRating(vendorId)]);
      setVendorDetailData({ profile: p.status==="fulfilled"?p.value.data:null, esg: e.status==="fulfilled"?e.value.data:[], rating: r.status==="fulfilled"?r.value.data:null });
    } catch { toast.error("Failed to load vendor profile"); }
    finally { setVendorDetailLoading(false); }
  };

  const filtered = filter==="all" ? requests : requests.filter(r=>r.status===filter);

  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120,borderRadius:12}}/>)}</div>;

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      <div style={{ marginBottom:18, background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"18px 20px" }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>Procurement requests</div>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:800, color:"#0F172A", marginBottom:6, letterSpacing:0 }}>Manage your RFPs and quotes</h2>
        <p style={{ fontSize:13, color:"#64748B", lineHeight:1.55 }}>Create buying requirements, compare supplier quotes, and close awarded contracts from one place.</p>
      </div>
      {/* Header + create */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>My procurement requests</h2>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>{requests.length} total · {requests.filter(r=>r.status==="active").length} active</p>
        </div>
        <button onClick={()=>setCreating(c=>!c)}
          style={{ background: creating?"var(--cream,#F2EBD9)":"var(--teal,#18664A)", color: creating?"var(--navy,#0B1D33)":"white", border: creating?"1px solid var(--border,#D4C9B5)":"none", borderRadius:6, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {creating ? "Cancel" : "+ New RFP"}
        </button>
      </div>

      {/* Create RFP panel — expands inline */}
      {creating && (
        <div style={{ background:"white", border:"1.5px solid var(--teal,#18664A)", borderRadius:14, padding:"28px 32px", marginBottom:24, boxShadow:"0 4px 20px rgba(11,29,51,.08)", animation:"fadeUp .3s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
            <div style={{ width:6, height:24, background:"var(--teal,#18664A)", borderRadius:3 }}/>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--navy,#0B1D33)" }}>New procurement request</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>What do you need? *</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Logistics partner for last-mile delivery in Mumbai"
                style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
            </div>
            <Select label="Category *" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
              options={[{value:"",label:"Select category"},...SERVICE_CATEGORIES.map(c=>({value:c,label:c}))]}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Budget</label>
                <input value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))} placeholder="₹10,000–₹50,000"
                  style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Deadline</label>
                <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}
                  style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
              </div>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase" }}>Description</label>
                <AIBtn loading={genLoading==="description"} onClick={()=>aiGenerate("description")}/>
              </div>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3}
                placeholder="Describe your requirement — quantity, specifications, delivery terms…"
                style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", resize:"vertical", lineHeight:1.6 }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase" }}>Impact requirements</label>
                <AIBtn loading={genLoading==="impact_requirements"} onClick={()=>aiGenerate("impact_requirements")}/>
              </div>
              <textarea value={form.impact_requirements} onChange={e=>setForm(p=>({...p,impact_requirements:e.target.value}))} rows={2}
                placeholder="e.g. Prefer women-led vendors, MSME certified, local sourcing…"
                style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", resize:"vertical", lineHeight:1.6 }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Location</label>
              <input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="City, State"
                style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", letterSpacing:".08em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Min ESG score (0–100)</label>
              <input type="number" min="0" max="100" value={form.min_esg_score} onChange={e=>setForm(p=>({...p,min_esg_score:e.target.value}))} placeholder="e.g. 40"
                style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={create} disabled={saving}
              style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"12px 28px", fontSize:14, fontWeight:600, cursor:saving?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:8 }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--teal-2,#22895F)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--teal,#18664A)"}>
              {saving ? <><span className="spinner" style={{width:14,height:14}}/> Posting…</> : "Post RFP →"}
            </button>
            <button onClick={()=>setCreating(false)} style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"12px 20px", fontSize:13, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {["all","active","closed","completed"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"7px 16px", borderRadius:99, border:`1.5px solid ${filter===f?"var(--navy,#0B1D33)":"var(--border,#D4C9B5)"}`, background:filter===f?"var(--navy,#0B1D33)":"white", color:filter===f?"var(--cream,#F2EBD9)":"var(--muted,#67788D)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* RFP list */}
      {filtered.length === 0
        ? <Empty icon="📋" title="No requests here" desc="Post an RFP to start receiving bids from verified vendors"
            action={<button onClick={()=>setCreating(true)} style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Post your first RFP</button>}/>
        : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map(r=>(
              <RequestCard key={r.id} req={r}
                onViewBids={viewBids}
                onAiMatch={getAiMatch}
                onClose={(id)=>setConfirmClose(id)}
                onReopen={(id)=>setConfirmReopen(id)}
                onDelete={(id)=>setConfirmDelete(id)}
              />
            ))}
          </div>
      }

      {/* ── Bids modal ── */}
      <Modal open={!!bidsModal} onClose={()=>{setBidsModal(null);setBids([]);setAiSummary("");}} title={`Bids — ${bidsModal?.title}`} width={660}>
        {bidsLoading
          ? <div style={{ textAlign:"center", padding:"40px" }}><span className="spinner" style={{width:32,height:32}}/></div>
          : bids.length === 0
          ? <Empty icon="📨" title="No bids yet" desc="No vendors have submitted proposals for this RFP yet"/>
          : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Bid comparison */}
              {aiSummary && (
                <div style={{ background:"var(--navy,#0B1D33)", borderRadius:10, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>✨</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:5 }}>Bid comparison</div>
                    <div style={{ fontSize:13, color:"rgba(242,235,217,.8)", lineHeight:1.6 }}>{aiSummary}</div>
                  </div>
                </div>
              )}
              {[...bids].sort((a,b)=>a.status==="awarded"?-1:b.status==="awarded"?1:0).map(b=>(
                <BidCard key={b.id} bid={b} onUpdate={updateBid} onVendorClick={openBidVendor}/>
              ))}
            </div>
          )
        }
      </Modal>

      {/* ── Match modal ── */}
      <Modal open={!!aiModal} onClose={()=>{setAiModal(null);setAiResults(null);}} title="Supplier matching" width={580}>
        {aiLoading
          ? <div style={{ textAlign:"center", padding:"40px" }}>
              <span className="spinner" style={{width:32,height:32,borderTopColor:"var(--teal,#18664A)",borderColor:"rgba(24,102,74,.2)"}}/><br/>
              <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:16 }}>Finding best vendor matches…</div>
            </div>
          : aiResults?.length > 0
          ? <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {aiResults.map((m,i)=>{
                const esgColor = (m.esg_score||0)>=80?"var(--teal,#18664A)":(m.esg_score||0)>=60?"var(--amber,#B8720A)":"var(--red,#B84232)";
                return (
                  <div key={i} style={{ background:"white", border:`1.5px solid ${i===0?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"16px 18px" }}>
                    {/* Header row */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                          {i===0 && <span style={{ fontSize:9, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--teal,#18664A)" }}>🏆 Best match</span>}
                          {m.is_women_owned && <span style={{ fontSize:9, fontWeight:700, color:"#db2777", background:"rgba(244,114,182,.1)", padding:"2px 7px", borderRadius:99 }}>Women-led</span>}
                        </div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{m.vendor_name}</div>
                        <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap" }}>
                          {m.location && <span style={{ fontSize:12, color:"var(--muted,#67788D)" }}>📍 {m.location}</span>}
                          {m.esg_score > 0 && <span style={{ fontSize:12, fontWeight:700, color:esgColor }}>🌱 ESG {m.esg_score}/100 {m.esg_band?`· ${m.esg_band}`:""}</span>}
                        </div>
                      </div>
                      <span style={{ background:i===0?"var(--teal,#18664A)":"var(--cream,#F2EBD9)", color:i===0?"white":"var(--navy,#0B1D33)", fontSize:13, fontWeight:700, padding:"5px 12px", borderRadius:99, flexShrink:0 }}>{m.score}% match</span>
                    </div>
                    {/* Match reason */}
                    <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55, marginBottom:12, paddingBottom:12, borderBottom:"1px solid var(--border,#D4C9B5)" }}>
                      {m.reason}
                    </div>
                    {/* Actions */}
                    <div style={{ display:"flex", gap:8 }}>
                      <button
                        onClick={()=>{ if(m.vendor_id) openBidVendor(m.vendor_id, m.vendor_name); }}
                        disabled={!m.vendor_id}
                        style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"8px 16px", fontSize:12, fontWeight:600, cursor:m.vendor_id?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", opacity:m.vendor_id?1:.5 }}
                        onMouseEnter={e=>{ if(m.vendor_id) e.currentTarget.style.background="var(--teal,#18664A)"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background="var(--navy,#0B1D33)"; }}>
                        View full profile →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          : aiResults !== null
          ? <Empty icon="🌱" title="No matches yet" desc="No verified vendors match this requirement. Try lowering the minimum ESG score or broadening the category."/>
          : null
        }
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await buyerAPI.deleteRequest(confirmDelete);toast.success("Deleted");load();}} title="Delete RFP" message="Permanently delete this request?" variant="danger"/>
      <ConfirmModal open={!!confirmClose} onClose={()=>setConfirmClose(null)} onConfirm={async()=>{await buyerAPI.closeRequest(confirmClose,{close_reason:"Closed by buyer"});toast.success("Closed");load();}} title="Close RFP" message="Close this request? Vendors can no longer submit bids." variant="danger" confirmLabel="Close RFP"/>
      <ConfirmModal open={!!confirmReopen} onClose={()=>setConfirmReopen(null)} onConfirm={async()=>{await buyerAPI.reopenRequest(confirmReopen);toast.success("Reopened!");load();}} title="Reopen RFP" message="Reopen this request? It will be visible to vendors again." variant="success"/>

      {/* Award confirm — custom modal for richer messaging */}
      {confirmAward && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setConfirmAward(null); }}
          style={{ position:"fixed", inset:0, background:"rgba(11,29,51,0.5)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1200, padding:20 }}>
          <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:16, width:"100%", maxWidth:440, padding:"32px 28px", boxShadow:"0 24px 80px rgba(11,29,51,.2)", textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 18px" }}>🏆</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:10 }}>Award contract?</h3>
            <p style={{ fontSize:14, color:"var(--muted,#67788D)", lineHeight:1.7, marginBottom:8 }}>
              You're awarding this contract to <strong style={{ color:"var(--navy,#0B1D33)" }}>{confirmAward.vendorName}</strong>.
            </p>
            <p style={{ fontSize:13, color:"var(--amber,#B8720A)", background:"var(--amber-bg,#FDF3E4)", borderRadius:8, padding:"10px 14px", marginBottom:24, lineHeight:1.6 }}>
              This will also <strong>close the RFP</strong> — no further bids will be accepted.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setConfirmAward(null)} disabled={awarding}
                style={{ flex:1, padding:"11px", background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, fontSize:13, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleAward} disabled={awarding}
                style={{ flex:1, padding:"11px", background:"var(--teal,#18664A)", border:"none", borderRadius:6, fontSize:13, fontWeight:600, color:"white", cursor:awarding?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {awarding ? <><span className="spinner" style={{width:13,height:13}}/> Awarding…</> : "🏆 Award & close RFP"}
              </button>
            </div>
          </div>
        </div>
      )}

      <VendorDetailModal
        open={!!vendorDetailData || vendorDetailLoading}
        onClose={()=>{ setVendorDetailData(null); setVendorDetailLoading(false); setShowBidVendorContact(false); }}
        detail={vendorDetailData}
        loading={vendorDetailLoading}
        vendorName={vendorDetailName}
        showContact={showBidVendorContact}
        onShowContact={()=>setShowBidVendorContact(true)}
      />
    </div>
  );
}

/* ─────────────────────────────────── Bid card (module-level) ── */
function BidCard({ bid, onUpdate, onVendorClick }) {
  const [showContact, setShowContact] = useState(false);
  const color = BID_COLOR[bid.status] || "var(--muted,#67788D)";
  const hasContact = bid.vendor_email || bid.vendor_phone;
  return (
    <div style={{ background:"white", border:`1.5px solid ${bid.status==="awarded"?"var(--teal,#18664A)":bid.status==="shortlisted"?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, overflow:"hidden" }}>
      {bid.status==="awarded" && (
        <div style={{ background:"var(--teal,#18664A)", padding:"8px 20px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🏆</span>
          <span style={{ fontSize:12, fontWeight:700, color:"white", letterSpacing:".04em" }}>Contract awarded — deal closed</span>
        </div>
      )}
      <div style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10 }}>
        <div>
          <button onClick={()=>onVendorClick?.(bid.vendor_id, bid.vendor_name)}
            style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:3, background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left", textDecoration:"underline", textDecorationStyle:"dotted", textUnderlineOffset:3 }}>
            {bid.vendor_name}
          </button>
          <div style={{ fontSize:12, color:"var(--muted,#67788D)" }}>
            {bid.vendor_location && <span>📍 {bid.vendor_location} · </span>}
            {bid.vendor_esg_score > 0 && <span style={{ color:"var(--teal,#18664A)" }}>ESG {bid.vendor_esg_score}/100</span>}
          </div>
        </div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${color}15`, padding:"5px 12px", borderRadius:99, flexShrink:0 }}>
          <span style={{ fontSize:14 }}>{BID_ICON[bid.status]}</span>
          <span style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".06em" }}>{bid.status?.replace(/_/g," ")}</span>
        </div>
      </div>
      <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.6, marginBottom:10 }}>{bid.cover_note}</div>
      <div style={{ display:"flex", gap:16, fontSize:12, color:"var(--muted,#67788D)", marginBottom: bid.status==="submitted"||bid.status==="under_review"||bid.status==="shortlisted" ? 12 : 0 }}>
        {bid.proposed_price && <span>💰 {bid.proposed_price}</span>}
        {bid.timeline       && <span>⏱ {bid.timeline}</span>}
      </div>
      {/* Actions */}
      {bid.status==="submitted" && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", paddingTop:10, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          <ActionBtn label="👀 Review" onClick={()=>onUpdate(bid.id,"under_review")} color="var(--amber,#B8720A)"/>
          <ActionBtn label="⭐ Shortlist" onClick={()=>onUpdate(bid.id,"shortlisted")} color="var(--teal,#18664A)"/>
          <ActionBtn label="✗ Decline" onClick={()=>onUpdate(bid.id,"declined")} color="var(--red,#B84232)" ghost/>
        </div>
      )}
      {bid.status==="under_review" && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", paddingTop:10, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          <ActionBtn label="⭐ Shortlist" onClick={()=>onUpdate(bid.id,"shortlisted")} color="var(--teal,#18664A)"/>
          <ActionBtn label="🏆 Award" onClick={()=>onUpdate(bid.id,"awarded")} color="var(--navy,#0B1D33)"/>
          <ActionBtn label="✗ Decline" onClick={()=>onUpdate(bid.id,"declined")} color="var(--red,#B84232)" ghost/>
        </div>
      )}
      {bid.status==="shortlisted" && (
        <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          <ActionBtn label="🏆 Award contract" onClick={()=>onUpdate(bid.id,"awarded")} color="var(--teal,#18664A)"/>
          <ActionBtn label="✗ Decline" onClick={()=>onUpdate(bid.id,"declined")} color="var(--red,#B84232)" ghost/>
        </div>
      )}
      {/* Contact details */}
      {hasContact && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border,#D4C9B5)" }}>
          {!showContact
            ? <button onClick={()=>setShowContact(true)}
                style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:6, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                📞 Show contact details
              </button>
            : <div style={{ display:"flex", gap:20, flexWrap:"wrap", fontSize:13 }}>
                {bid.vendor_email && (
                  <a href={`mailto:${bid.vendor_email}`}
                    style={{ display:"flex", alignItems:"center", gap:6, color:"var(--navy,#0B1D33)", textDecoration:"none", fontWeight:500 }}>
                    <span style={{ fontSize:15 }}>✉️</span> {bid.vendor_email}
                  </a>
                )}
                {bid.vendor_phone && (
                  <a href={`tel:${bid.vendor_phone}`}
                    style={{ display:"flex", alignItems:"center", gap:6, color:"var(--navy,#0B1D33)", textDecoration:"none", fontWeight:500 }}>
                    <span style={{ fontSize:15 }}>📞</span> {bid.vendor_phone}
                  </a>
                )}
              </div>
          }
        </div>
      )}
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, color, ghost }) {
  return (
    <button onClick={onClick} style={{ background: ghost?"none":"white", color, border:`1.5px solid ${ghost?color:"var(--border,#D4C9B5)"}`, borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.background=color; e.currentTarget.style.color="white"; e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=ghost?"none":"white"; e.currentTarget.style.color=color; e.currentTarget.style.borderColor=ghost?color:"var(--border,#D4C9B5)"; }}>
      {label}
    </button>
  );
}

/* ─────────────────────────────────── VENDORS tab ── */
function BuyerVendors({ toast }) {
  const nav = useNavigate();
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(() => sessionStorage.getItem("buyerProcurementQuery") || "");
  const [category, setCategory]   = useState(() => sessionStorage.getItem("buyerProcurementCategory") || "");
  const [minEsg, setMinEsg]       = useState("");
  const [cert, setCert]           = useState("");
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailContact, setShowDetailContact] = useState(false);
  const [aiMatch, setAiMatch]     = useState({}); // vendor_id -> match reason
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const r = await vendorAPI.getRanked();
      setVendors(r.data);
    } catch { setLoadError("Supplier data could not be loaded. Please retry."); toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  const resetSearch = async () => {
    setSearch("");
    setCategory("");
    setCert("");
    setMinEsg("");
    sessionStorage.removeItem("buyerProcurementQuery");
    sessionStorage.removeItem("buyerProcurementCategory");
    await load();
  };

  const search_vendors = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const r = await vendorAPI.listVendors({
        search: category ? "" : search,
        category,
        min_esg: Number(minEsg)||0,
        certification: cert
      });
      setVendors(r.data);
    } catch { setLoadError("Supplier search is temporarily unavailable. Please retry."); toast.error("Search failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{
    const hadHomeSearch = sessionStorage.getItem("buyerProcurementQuery") || sessionStorage.getItem("buyerProcurementCategory");
    if (hadHomeSearch) {
      search_vendors();
      sessionStorage.removeItem("buyerProcurementQuery");
      sessionStorage.removeItem("buyerProcurementCategory");
    } else {
      load();
    }
  },[]);

  const openDetail = async (v) => {
    setSelected(v); setDetail(null); setDetailLoading(true); setShowDetailContact(false);
    try {
      const id = v.vendor_id||v.id;
      const [p,e,r] = await Promise.allSettled([vendorAPI.getVendor(id), vendorAPI.getESG(id), buyerAPI.getRating(id)]);
      setDetail({ profile: p.status==="fulfilled"?p.value.data:null, esg: e.status==="fulfilled"?e.value.data:[], rating: r.status==="fulfilled"?r.value.data:null });
    } catch { toast.error("Failed to load vendor"); }
    finally { setDetailLoading(false); }
  };

  const filtered = vendors.filter(v=>{
    const text = searchableVendorText(v);
    const terms = queryTerms(search);
    const categoryOk = !category || text.includes(category.toLowerCase().split(" ")[0]);
    if (!terms.length) return categoryOk;
    const termOk = terms.some(t => text.includes(t));
    return categoryOk && (termOk || Boolean(category));
  });

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"18px 20px", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>Supplier marketplace</div>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:800, color:"#0F172A", marginBottom:6, letterSpacing:0 }}>Browse verified suppliers</h2>
        <p style={{ fontSize:13, color:"#64748B", lineHeight:1.55 }}>Compare suppliers by category, certification, location and ESG readiness before opening the profile.</p>
      </div>
      {/* Search bar */}
      <div style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:16, marginBottom:14, boxShadow:"0 1px 8px rgba(11,29,51,.05)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div style={{ flex:1, minWidth:180 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search vendors by name or location…"
            style={{ width:"100%", padding:"11px 16px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"#0F172A", border:"1.5px solid #CBD5E1", borderRadius:7, outline:"none" }}/>
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)} style={{ minWidth:180 }}
          options={[{value:"",label:"All categories"},{value:"Healthcare & Wellness",label:"Hospitals & Healthcare"},...SERVICE_CATEGORIES.filter(c=>c!=="Healthcare & Wellness").map(c=>({value:c,label:c}))]}/>
        <Select value={cert} onChange={e=>setCert(e.target.value)} style={{ minWidth:160 }}
          options={[{value:"",label:"Any certification"},...CERT_TYPES.map(c=>({value:c,label:c.replace(/_/g," ")}))]}/>
        <div style={{ width:130 }}>
          <input type="number" min="0" max="100" value={minEsg} onChange={e=>setMinEsg(e.target.value)} placeholder="Min ESG score"
            style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
        </div>
        <button onClick={search_vendors} style={{ background:"#18664A", color:"white", border:"none", borderRadius:6, padding:"11px 20px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Search</button>
        <button onClick={resetSearch} style={{ background:"#fff", border:"1px solid #CBD5E1", borderRadius:6, padding:"11px 16px", fontSize:13, fontWeight:700, color:"#475569", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Reset</button>
      </div>
      {!loading && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:12, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, color:"var(--muted,#67788D)" }}>{filtered.length} supplier{filtered.length!==1?"s":""} found</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {category && <span style={{ fontSize:11, fontWeight:700, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"4px 9px", borderRadius:99 }}>{category}</span>}
            {cert && <span style={{ fontSize:11, fontWeight:700, color:"var(--navy,#0B1D33)", background:"var(--cream,#F2EBD9)", padding:"4px 9px", borderRadius:99 }}>{cert.replace(/_/g," ")}</span>}
            {minEsg && <span style={{ fontSize:11, fontWeight:700, color:"var(--amber,#B8720A)", background:"var(--amber-bg,#FDF3E4)", padding:"4px 9px", borderRadius:99 }}>ESG {minEsg}+</span>}
          </div>
        </div>
      )}

      {loading
        ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:160,borderRadius:12}}/>)}</div>
        : loadError
        ? <Empty icon="ERR" title="Suppliers could not be loaded" desc={loadError} action={<button onClick={load} style={{background:"#18664A",color:"white",border:"none",borderRadius:6,padding:"10px 16px",fontWeight:800,cursor:"pointer"}}>Retry</button>}/>
        : filtered.length === 0
        ? (
          <Empty
            icon="SUP"
            title="No exact supplier match yet"
            desc={search || category ? "Clear filters to browse all suppliers, or create an RFP so vendors can quote against this requirement." : "Try another category or create a new procurement request."}
            action={
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={resetSearch} style={{ background:"#18664A", color:"white", border:"none", borderRadius:6, padding:"10px 16px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Show all suppliers</button>
                <button onClick={()=>nav("/dashboard/requests")} style={{ background:"#fff", color:"#0F172A", border:"1px solid #CBD5E1", borderRadius:6, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Create RFP</button>
              </div>
            }
          />
        )
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {filtered.map((v,i)=>{
              const id  = v.vendor_id||v.id;
              const esg = v.esg_score||0;
              const esgColor = esg>=80?"var(--teal,#18664A)":esg>=60?"var(--amber,#B8720A)":"var(--red,#B84232)";
              return (
                <div key={id} onClick={()=>openDetail(v)}
                  style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"16px 18px", cursor:"pointer", boxShadow:"0 1px 6px rgba(11,29,51,.04)", transition:"all .18s", minHeight:210 }}
                  onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 6px 18px rgba(11,29,51,.10)"; e.currentTarget.style.borderColor="#CBD5E1"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 1px 6px rgba(11,29,51,.04)"; e.currentTarget.style.borderColor="#E2E8F0"; }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:900, letterSpacing:".08em", textTransform:"uppercase", color:i===0?"#18664A":"#64748B", background:i===0?"#ECFDF5":"#F8FAFC", border:"1px solid #E2E8F0", padding:"3px 8px", borderRadius:99 }}>{i===0 ? "Preferred supplier" : "Verified profile"}</span>
                    {v.is_women_owned && <span style={{ fontSize:10, fontWeight:800, color:"#BE185D", background:"#FDF2F8", border:"1px solid #FBCFE8", padding:"3px 8px", borderRadius:99, flexShrink:0 }}>Women-led</span>}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ display:"flex", gap:9, alignItems:"center", flex:1, marginRight:8 }}>
                      <div style={{ width:38, height:38, borderRadius:8, background:"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", color:"#18664A", flexShrink:0 }}>
                        {v.logo_url?<img src={v.logo_url} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<SectorIcon iconKey={sectorIconKey(v.category||v.service_categories)} size={22}/>} 
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:800, color:"#0F172A", lineHeight:1.3 }}>{v.name||v.organization_name}</div>
                    </div>
                  </div>
                  {v.location && <div style={{ fontSize:12, color:"var(--muted,#67788D)", marginBottom:8 }}>📍 {v.location}</div>}
                  {v.description && <div style={{ fontSize:12, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:10 }}>{v.description?.slice(0,70)}…</div>}
                  {/* AI match reason */}
                  {aiMatch[id] && <div style={{ fontSize:11, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"5px 8px", borderRadius:6, marginBottom:10, lineHeight:1.45 }}>✨ {aiMatch[id]}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:esgColor, background:`${esgColor}12`, padding:"3px 8px", borderRadius:99 }}>ESG {esg}/100</span>
                    {v.esg_band && <span style={{ fontSize:11, color:"var(--muted,#67788D)" }}>{v.esg_band}</span>}
                  </div>
                  <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid var(--border,#D4C9B5)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:"var(--muted,#67788D)" }}>Profile, ESG and contact details</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--teal,#18664A)" }}>View supplier</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      <VendorDetailModal
        open={!!selected}
        onClose={()=>{setSelected(null);setDetail(null);setShowDetailContact(false);}}
        detail={detail}
        loading={detailLoading}
        vendorName={selected?.name||selected?.organization_name}
        showContact={showDetailContact}
        onShowContact={()=>setShowDetailContact(true)}
      />
    </div>
  );
}

/* ─────────────────────────────────── VendorDetailModal (module-level, shared) ── */
function VendorDetailModal({ open, onClose, detail, loading, vendorName, showContact, onShowContact }) {
  return (
    <Modal open={open} onClose={onClose} title="Vendor profile" width={680}>
      {loading
        ? <div style={{ textAlign:"center", padding:"40px" }}><span className="spinner" style={{width:32,height:32}}/></div>
        : detail ? (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* ── Header ── */}
            <div style={{ background:"var(--navy,#0B1D33)", borderRadius:12, padding:"22px 26px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--cream,#F2EBD9)", marginBottom:10 }}>
                <span style={{display:"inline-flex",alignItems:"center",gap:10}}>{detail.profile?.logo_url&&<img src={detail.profile.logo_url} alt="" style={{width:42,height:42,objectFit:"contain",background:"white",borderRadius:8}}/>}{detail.profile?.organization_name || vendorName}</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                {detail.profile?.is_women_owned && <span style={{ fontSize:10, fontWeight:700, color:"#f9a8d4", background:"rgba(244,114,182,.2)", padding:"3px 9px", borderRadius:99 }}>👩 Women-owned</span>}
                {detail.profile?.verification_status==="verified" && <span style={{ fontSize:10, fontWeight:700, color:"#5FCFA0", background:"rgba(95,207,160,.15)", padding:"3px 9px", borderRadius:99 }}>✓ Platform verified</span>}
                {detail.profile?.gstin_verified && <span style={{ fontSize:10, fontWeight:700, color:"#5FCFA0", background:"rgba(95,207,160,.15)", padding:"3px 9px", borderRadius:99 }}>✓ GST verified</span>}
                {detail.profile?.pan_verified && <span style={{ fontSize:10, fontWeight:700, color:"#5FCFA0", background:"rgba(95,207,160,.15)", padding:"3px 9px", borderRadius:99 }}>✓ PAN verified</span>}
                {detail.profile?.location && <span style={{ fontSize:12, color:"rgba(242,235,217,.6)" }}>📍 {detail.profile.location}</span>}
                {detail.profile?.esg_band && <span style={{ fontSize:12, fontWeight:700, color:"#5FCFA0" }}>🌱 {detail.profile.esg_band} · {detail.profile.esg_score}/100</span>}
                {detail.rating?.average_rating > 0 && <span style={{ fontSize:12, color:"#F5B342" }}>⭐ {detail.rating.average_rating.toFixed(1)} ({detail.rating.total_reviews} reviews)</span>}
              </div>
            </div>

            {detail.profile?.impact_statement && (
              <div style={{ padding:"13px 16px", background:"var(--teal-bg,#E4F2EB)", borderRadius:10, border:"1px solid rgba(24,102,74,.2)", fontSize:14, color:"var(--teal,#18664A)", lineHeight:1.75, fontStyle:"italic" }}>
                "{detail.profile.impact_statement}"
              </div>
            )}
            {detail.profile?.description && (
              <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.75, padding:"14px 16px", background:"var(--cream,#F2EBD9)", borderRadius:10 }}>
                {detail.profile.description}
              </div>
            )}

            {detail.profile?.services?.length > 0 && <div><SectionHead>Services and current offers</SectionHead><div className="buyer-service-strip">{detail.profile.services.map(service=><div className="buyer-service-tile" key={service.id}><div>{service.image_url?<img src={resolveMediaUrl(service.image_url)} alt={service.title}/>:<span>Photo pending</span>}</div><strong>{service.title}</strong><small>{service.offer_is_live&&service.offer_price!=null?`${service.currency} ${service.offer_price}`:service.base_price!=null?`${service.currency} ${service.base_price}`:service.price_range||"Request a quote"}{service.unit?` / ${service.unit}`:""}</small>{service.offer_is_live&&<b>Current offer</b>}</div>)}</div></div>}

            {/* ── Business overview ── */}
            {(() => {
              const p = detail.profile;
              const cats   = parseJSON(p?.service_categories);
              const certs  = parseJSON(p?.certification_types);
              const sdgs   = parseJSON(p?.sdg_tags);
              const cities = parseJSON(p?.cities_served);
              const majorCustomers = parseJSON(p?.major_customers);
              const hasInfo = p?.year_founded||p?.team_size_band||p?.annual_turnover_band||p?.website||cats.length||certs.length||sdgs.length||cities.length||majorCustomers.length;
              if (!hasInfo) return null;
              return (
                <div>
                  <SectionHead>Business overview</SectionHead>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {p.year_founded && <InfoRow label="Founded" value={p.year_founded}/>}
                    {p.team_size_band && <InfoRow label="Team size" value={p.team_size_band}/>}
                    {p.annual_turnover_band && <InfoRow label="Annual turnover" value={p.annual_turnover_band}/>}
                    {p.website && <InfoRow label="Website" value={<a href={p.website} target="_blank" rel="noreferrer" style={{ color:"var(--teal,#18664A)", textDecoration:"none" }}>{p.website}</a>}/>}
                  </div>
                  {cats.length > 0  && <TagRow label="Service categories" tags={cats} color="var(--navy,#0B1D33)" bg="var(--cream,#F2EBD9)"/>}
                  {cities.length > 0 && <TagRow label="Cities served" tags={cities} color="var(--navy,#0B1D33)" bg="var(--cream,#F2EBD9)"/>}
                  {majorCustomers.length > 0 && <TagRow label="Major customers" tags={majorCustomers} color="var(--navy,#0B1D33)" bg="var(--cream,#F2EBD9)"/>}
                  {certs.length > 0  && <TagRow label="Certifications" tags={certs.map(c=>c.replace(/_/g," "))} color="var(--teal,#18664A)" bg="var(--teal-bg,#E4F2EB)"/>}
                  {sdgs.length > 0   && <TagRow label="SDG alignment" tags={sdgs} color="var(--amber,#B8720A)" bg="var(--amber-bg,#FDF3E4)"/>}
                </div>
              );
            })()}

            {/* ── ESG Score Summary ── */}
            {detail.esg?.length > 0 && (() => {
              const e = detail.esg[0];
              const sc = s => s>=70?"var(--teal,#18664A)":s>=40?"var(--amber,#B8720A)":"var(--red,#B84232)";
              return (
                <div>
                  <SectionHead>ESG score breakdown</SectionHead>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    {[
                      { l:"Overall", v:e.esg_score, sub:e.esg_band },
                      { l:"Environmental", v:e.e_score, sub:"E pillar" },
                      { l:"Social", v:e.s_score, sub:"S pillar" },
                      { l:"Governance", v:e.g_score, sub:"G pillar" },
                    ].map(s=>(
                      <div key={s.l} style={{ background:"var(--cream,#F2EBD9)", borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:sc(s.v||0), lineHeight:1 }}>{Math.round(s.v||0)}</div>
                        <div style={{ fontSize:9, color:"var(--muted,#67788D)", textTransform:"uppercase", letterSpacing:".07em", marginTop:4 }}>{s.l}</div>
                        {s.sub && <div style={{ fontSize:10, color:sc(s.v||0), marginTop:2, fontWeight:600 }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── ESG Details ── */}
            {detail.esg?.length > 0 && (() => {
              const e = detail.esg[0];
              const envRows = [
                { l:"Renewable energy",        v:e.renewable_energy_pct,        unit:"%" },
                { l:"Waste recycled",           v:e.waste_recycling_pct,         unit:"%" },
                { l:"EV fleet",                 v:e.ev_fleet_pct,                unit:"%" },
                { l:"Biodegradable packaging",  v:e.biodegradable_packaging_pct, unit:"%" },
                { l:"Carbon saved (tCO₂)",      v:e.carbon_saved,                unit:"" },
                { l:"Carbon offset programme",  v:e.carbon_offset_programme,     bool:true },
              ].filter(r => r.bool ? r.v : (r.v||0)>0);
              const socRows = [
                { l:"Total employees",          v:e.total_employees,       unit:"" },
                { l:"Women employees",          v:e.women_employees_pct,   unit:"%" },
                { l:"Women in leadership",      v:e.women_leadership_pct,  unit:"%" },
                { l:"SC/ST/OBC employees",      v:e.sc_st_obc_pct,         unit:"%" },
                { l:"PwD employees",            v:e.pwd_employees_pct,     unit:"%" },
                { l:"Jobs created",             v:e.jobs_created,          unit:"" },
                { l:"Jobs for marginalised",    v:e.jobs_marginalised,     unit:"" },
                { l:"Living wage compliance",   v:e.living_wage_compliance, bool:true },
                { l:"Health insurance coverage",v:e.health_insurance_pct,  unit:"%" },
                { l:"Training hrs / employee",  v:e.training_hours_per_emp,unit:"hrs" },
                { l:"Community sourcing",       v:e.community_sourcing_pct,unit:"%" },
                { l:"Local sourcing",           v:e.local_sourcing_pct,    unit:"%" },
              ].filter(r => r.bool ? r.v : (r.v||0)>0);
              const govRows = [
                { l:"Women ownership",    v:e.women_ownership_pct, unit:"%" },
                { l:"Women on board",     v:e.women_board_pct,     unit:"%" },
                { l:"Grievance mechanism",v:e.grievance_mechanism, bool:true },
                { l:"Annual report filed",v:e.annual_report_filed, bool:true },
                { l:"Data privacy policy",v:e.data_privacy_policy, bool:true },
              ].filter(r => r.bool ? r.v : (r.v||0)>0);
              if (!envRows.length && !socRows.length && !govRows.length) return null;
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {envRows.length > 0 && <div><SectionHead>🌍 Environmental</SectionHead><EsgTable rows={envRows}/></div>}
                  {socRows.length > 0 && <div><SectionHead>👥 Social</SectionHead><EsgTable rows={socRows}/></div>}
                  {govRows.length > 0 && <div><SectionHead>🏛 Governance</SectionHead><EsgTable rows={govRows}/></div>}
                </div>
              );
            })()}

            {/* ── ESG History ── */}
            {detail.esg?.length > 1 && (
              <div>
                <SectionHead>ESG score history</SectionHead>
                <div style={{ border:"1px solid var(--border,#D4C9B5)", borderRadius:10, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"var(--cream,#F2EBD9)" }}>
                        {["Year","Overall","E","S","G","Band"].map(h=>(
                          <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--muted,#67788D)", letterSpacing:".07em", textTransform:"uppercase", borderBottom:"1px solid var(--border,#D4C9B5)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.esg.map((row,i)=>{
                        const c = (row.esg_score||0)>=70?"var(--teal,#18664A)":(row.esg_score||0)>=40?"var(--amber,#B8720A)":"var(--red,#B84232)";
                        return (
                          <tr key={row.id} style={{ borderBottom:i<detail.esg.length-1?"1px solid var(--border,#D4C9B5)":"none", background:i===0?"rgba(24,102,74,.04)":"white" }}>
                            <td style={{ padding:"9px 14px", fontWeight:600, color:"var(--navy,#0B1D33)" }}>{row.year||new Date(row.created_at).getFullYear()}</td>
                            <td style={{ padding:"9px 14px", fontWeight:700, color:c }}>{Math.round(row.esg_score||0)}</td>
                            <td style={{ padding:"9px 14px", color:"var(--teal,#18664A)" }}>{Math.round(row.e_score||0)}</td>
                            <td style={{ padding:"9px 14px", color:"#db2777" }}>{Math.round(row.s_score||0)}</td>
                            <td style={{ padding:"9px 14px", color:"var(--navy,#0B1D33)" }}>{Math.round(row.g_score||0)}</td>
                            <td style={{ padding:"9px 14px", fontSize:11, color:"var(--muted,#67788D)" }}>{row.esg_band||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Contact ── */}
            {(detail.profile?.phone || detail.profile?.email) && (
              <div style={{ borderTop:"1px solid var(--border,#D4C9B5)", paddingTop:16 }}>
                {!showContact
                  ? <button onClick={onShowContact}
                      style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:13, fontWeight:600, padding:"10px 20px", borderRadius:6, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" }}>
                      📞 Show contact details
                    </button>
                  : <div style={{ background:"var(--cream,#F2EBD9)", borderRadius:10, padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:2 }}>Contact</div>
                      {detail.profile.email && (
                        <a href={`mailto:${detail.profile.email}`} style={{ display:"flex", alignItems:"center", gap:10, color:"var(--navy,#0B1D33)", textDecoration:"none", fontSize:14, fontWeight:500 }}>
                          <span style={{ fontSize:18 }}>✉️</span> {detail.profile.email}
                        </a>
                      )}
                      {detail.profile.phone && (
                        <a href={`tel:${detail.profile.phone}`} style={{ display:"flex", alignItems:"center", gap:10, color:"var(--navy,#0B1D33)", textDecoration:"none", fontSize:14, fontWeight:500 }}>
                          <span style={{ fontSize:18 }}>📞</span> {detail.profile.phone}
                        </a>
                      )}
                    </div>
                }
              </div>
            )}

          </div>
        ) : null
      }
    </Modal>
  );
}

/* ─────────────────────────────────── Vendor detail helpers (module-level) ── */
function SectionHead({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:10, paddingBottom:6, borderBottom:"1px solid var(--border,#D4C9B5)" }}>
      {children}
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ background:"var(--cream,#F2EBD9)", borderRadius:8, padding:"10px 14px" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:600, color:"var(--navy,#0B1D33)" }}>{value}</div>
    </div>
  );
}
function TagRow({ label, tags, color, bg }) {
  if (!tags?.length) return null;
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {tags.map((t,i)=>(
          <span key={i} style={{ fontSize:11, fontWeight:600, color, background:bg, padding:"3px 10px", borderRadius:99 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
function EsgTable({ rows }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {rows.map((r,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", background: i%2===0?"var(--cream,#F2EBD9)":"white", borderRadius:6 }}>
          <span style={{ fontSize:13, color:"var(--body,#253446)" }}>{r.l}</span>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--navy,#0B1D33)" }}>
            {r.bool ? (r.v ? "✓ Yes" : "✗ No") : `${r.v}${r.unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────── Shared ── */
function AIBtn({ loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, cursor:loading?"wait":"pointer", display:"inline-flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
      {loading ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Drafting...</> : <>Draft for me</>}
    </button>
  );
}
