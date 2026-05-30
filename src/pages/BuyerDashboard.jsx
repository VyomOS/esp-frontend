import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { buyerAPI, vendorAPI, chatAPI, notificationAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Btn, Input, Textarea, Select, Modal, Empty } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

/* ─────────────────────────────────── constants ── */
const SERVICE_CATEGORIES = [
  "Logistics & Delivery","Facilities & Cleaning","Staffing & Training",
  "Food & Catering","Textiles & Apparel","IT & Digital Services",
  "Green & Sustainability","Handicrafts & Artisan","Healthcare & Wellness","Construction & Fitout",
];
const CERT_TYPES = ["women_led","msme_udyam","sc_st_owned","shg","social_enterprise","cooperative","fair_trade","weps_signatory"];
const BID_COLOR  = { submitted:"var(--teal,#18664A)", under_review:"var(--amber,#B8720A)", shortlisted:"#6384ff", awarded:"var(--teal,#18664A)", declined:"var(--red,#B84232)" };
const BID_ICON   = { submitted:"📨", under_review:"👀", shortlisted:"⭐", awarded:"🏆", declined:"✗" };

/* ─────────────────────────────────── helpers ── */
const userName = () => localStorage.getItem("name") || "there";

/* ─────────────────────────────────── Main router ── */
export default function BuyerDashboard() {
  const loc  = useLocation();
  const nav  = useNavigate();
  const toast = useToast();
  const tab = loc.pathname.includes("requests") ? "requests"
    : loc.pathname.includes("vendors")           ? "vendors"
    : "home";

  return (
    <Layout>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"1.5px solid var(--border,#D4C9B5)", marginBottom:28, flexWrap:"wrap" }}>
        {[
          { id:"home",     label:"Home",          icon:"⬡" },
          { id:"requests", label:"My RFPs",        icon:"📋" },
          { id:"vendors",  label:"Find Vendors",   icon:"🌱" },
        ].map(t=>{
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={()=>nav(t.id==="home"?"/dashboard":`/dashboard/${t.id}`)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:active?"var(--navy,#0B1D33)":"var(--text3,#67788D)", borderBottom:`2px solid ${active?"var(--teal,#18664A)":"transparent"}`, marginBottom:"-1.5px", transition:"all .16s" }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
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

  useEffect(()=>{
    Promise.allSettled([
      buyerAPI.getMyRequests(), vendorAPI.getRanked(),
      notificationAPI.getAll({ unread_only: true, limit: 3 }),
    ]).then(([r,v,n])=>{
      const requests = r.status==="fulfilled" ? r.value.data : [];
      const ranked   = v.status==="fulfilled" ? v.value.data : [];
      setReqs(requests);
      setVendors(ranked.slice(0,4));
      if (n.status==="fulfilled") setNotifs((n.value.data.notifications || n.value.data || []).slice(0,3));

      // Fetch AI suggestions from dedicated endpoint
      buyerAPI.aiSuggestions({ requests, recent_activity: [] })
        .then(res => setAiSuggs(res.data.suggestions || []))
        .catch(() => setAiSuggs(buildBuyerSuggestions(requests)));
    }).finally(()=>setLoading(false));
  },[]);

  const active     = reqs.filter(r=>r.status==="active");
  const totalBids  = reqs.reduce((s,r)=>s+(r.bid_count||0),0);
  const unreviewed = reqs.filter(r=>r.status==="active" && (r.bid_count||0)>0).length;

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:80, borderRadius:12}}/>)}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, animation:"fadeUp .4s ease" }}>

      {/* ── Hero ── */}
      <div style={{ background:"var(--navy,#0B1D33)", borderRadius:16, padding:"32px 36px", position:"relative", overflow:"hidden" }}>
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
      {aiSuggs.length > 0 && (
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
            {notifs.map(n=>(
              <div key={n.id} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:"12px 18px", display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:16 }}>{n.type==="success"?"✅":n.type==="warning"?"⚠️":"ℹ️"}</span>
                <div>
                  <div style={{ fontSize:13, color:"var(--navy,#0B1D33)", lineHeight:1.55 }}>{n.message}</div>
                  <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:3 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
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
                ✨ AI match vendors
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
  const [aiSummary, setAiSummary] = useState("");
  // Confirms
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClose, setConfirmClose]   = useState(null);
  const [confirmReopen, setConfirmReopen] = useState(null);

  const load = () => buyerAPI.getMyRequests().then(r=>setRequests(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const create = async () => {
    if (!form.title.trim() || !form.category) { toast.error("Title and category are required"); return; }
    setSaving(true);
    try {
      await buyerAPI.createRequest({ ...form, min_esg_score: Number(form.min_esg_score)||0 });
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

  const updateBid = async (bidId, status) => {
    try { await buyerAPI.updateBidStatus(bidId,{status,buyer_note:""}); toast.success(`Bid ${status.replace(/_/g," ")}`); viewBids(bidsModal); }
    catch { toast.error("Failed"); }
  };

  const getAiMatch = async (id) => {
    setAiModal(id); setAiResults(null); setAiLoading(true);
    try {
      const r = await buyerAPI.aiVendorMatches(id, 4);
      // Response: [{vendor:{...}, match_reason, match_score}]
      const matches = Array.isArray(r.data) ? r.data.map(m => ({
        vendor_name: m.vendor?.organization_name || m.vendor?.name,
        score: m.match_score,
        reason: m.match_reason,
      })) : [];
      setAiResults(matches);
    }
    catch { toast.error("AI matching failed"); setAiResults([]); }
    finally { setAiLoading(false); }
  };

  const filtered = filter==="all" ? requests : requests.filter(r=>r.status===filter);

  if (loading) return <div style={{display:"flex",flexDirection:"column",gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120,borderRadius:12}}/>)}</div>;

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
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
              {/* AI bid summary */}
              {aiSummary && (
                <div style={{ background:"var(--navy,#0B1D33)", borderRadius:10, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>✨</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:5 }}>AI bid summary</div>
                    <div style={{ fontSize:13, color:"rgba(242,235,217,.8)", lineHeight:1.6 }}>{aiSummary}</div>
                  </div>
                </div>
              )}
              {bids.map(b=>(
                <BidCard key={b.id} bid={b} onUpdate={updateBid}/>
              ))}
            </div>
          )
        }
      </Modal>

      {/* ── AI match modal ── */}
      <Modal open={!!aiModal} onClose={()=>{setAiModal(null);setAiResults(null);}} title="✨ AI vendor matching" width={520}>
        {aiLoading
          ? <div style={{ textAlign:"center", padding:"40px" }}>
              <span className="spinner" style={{width:32,height:32,borderTopColor:"var(--teal,#18664A)",borderColor:"rgba(24,102,74,.2)"}}/><br/>
              <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:16 }}>Finding best vendor matches…</div>
            </div>
          : aiResults?.length > 0
          ? <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {aiResults.map((m,i)=>(
                <div key={i} style={{ background:"white", border:`1px solid ${i===0?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:10, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{m.vendor_name||m.name}</div>
                    <span style={{ background:i===0?"var(--teal,#18664A)":"var(--cream,#F2EBD9)", color:i===0?"white":"var(--navy,#0B1D33)", fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>{m.score}% match</span>
                  </div>
                  <div style={{ fontSize:13, color:"var(--muted,#67788D)", lineHeight:1.55 }}>{m.reason}</div>
                </div>
              ))}
            </div>
          : aiResults !== null
          ? <Empty icon="🌱" title="No matches yet" desc="No verified vendors match this requirement. Try lowering the minimum ESG score or broadening the category."/>
          : null
        }
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} onConfirm={async()=>{await buyerAPI.deleteRequest(confirmDelete);toast.success("Deleted");load();}} title="Delete RFP" message="Permanently delete this request?" variant="danger"/>
      <ConfirmModal open={!!confirmClose} onClose={()=>setConfirmClose(null)} onConfirm={async()=>{await buyerAPI.closeRequest(confirmClose,{close_reason:"Closed by buyer"});toast.success("Closed");load();}} title="Close RFP" message="Close this request? Vendors can no longer submit bids." variant="danger"/>
      <ConfirmModal open={!!confirmReopen} onClose={()=>setConfirmReopen(null)} onConfirm={async()=>{await buyerAPI.reopenRequest(confirmReopen);toast.success("Reopened!");load();}} title="Reopen RFP" message="Reopen this request? It will be visible to vendors again." variant="success"/>
    </div>
  );
}

/* ─────────────────────────────────── Bid card (module-level) ── */
function BidCard({ bid, onUpdate }) {
  const color = BID_COLOR[bid.status] || "var(--muted,#67788D)";
  return (
    <div style={{ background:"white", border:`1.5px solid ${bid.status==="shortlisted"?"var(--teal,#18664A)":bid.status==="awarded"?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:3 }}>{bid.vendor_name}</div>
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
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [minEsg, setMinEsg]       = useState("");
  const [cert, setCert]           = useState("");
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiMatch, setAiMatch]     = useState({}); // vendor_id -> match reason

  const load = async () => {
    setLoading(true);
    try {
      const r = await vendorAPI.getRanked();
      setVendors(r.data);
    } catch { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  const search_vendors = async () => {
    setLoading(true);
    try {
      const r = await vendorAPI.listVendors({ search, category, min_esg: Number(minEsg)||0, certification: cert });
      setVendors(r.data);
    } catch { toast.error("Search failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const openDetail = async (v) => {
    setSelected(v); setDetail(null); setDetailLoading(true);
    try {
      const id = v.vendor_id||v.id;
      const [p,e,r] = await Promise.allSettled([vendorAPI.getVendor(id), vendorAPI.getESG(id), buyerAPI.getRating(id)]);
      setDetail({ profile: p.status==="fulfilled"?p.value.data:null, esg: e.status==="fulfilled"?e.value.data:[], rating: r.status==="fulfilled"?r.value.data:null });
    } catch { toast.error("Failed to load vendor"); }
    finally { setDetailLoading(false); }
  };

  const filtered = vendors.filter(v=>{
    const name = (v.name||v.organization_name||"").toLowerCase();
    const s = search.toLowerCase();
    return !s || name.includes(s) || (v.location||"").toLowerCase().includes(s);
  });

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      {/* Search bar */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div style={{ flex:1, minWidth:180 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search vendors by name or location…"
            style={{ width:"100%", padding:"11px 16px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)} style={{ minWidth:180 }}
          options={[{value:"",label:"All categories"},...SERVICE_CATEGORIES.map(c=>({value:c,label:c}))]}/>
        <Select value={cert} onChange={e=>setCert(e.target.value)} style={{ minWidth:160 }}
          options={[{value:"",label:"Any certification"},...CERT_TYPES.map(c=>({value:c,label:c.replace(/_/g," ")}))]}/>
        <div style={{ width:130 }}>
          <input type="number" min="0" max="100" value={minEsg} onChange={e=>setMinEsg(e.target.value)} placeholder="Min ESG score"
            style={{ width:"100%", padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
        </div>
        <button onClick={search_vendors} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"11px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Search</button>
        <button onClick={load} style={{ background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"11px 16px", fontSize:13, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Reset</button>
      </div>

      {loading
        ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:160,borderRadius:12}}/>)}</div>
        : filtered.length === 0
        ? <Empty icon="🌱" title="No vendors found" desc="Try different search terms or remove filters"/>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
            {filtered.map((v,i)=>{
              const id  = v.vendor_id||v.id;
              const esg = v.esg_score||0;
              const esgColor = esg>=80?"var(--teal,#18664A)":esg>=60?"var(--amber,#B8720A)":"var(--red,#B84232)";
              return (
                <div key={id} onClick={()=>openDetail(v)}
                  style={{ background:"white", border:`1px solid ${i===0?"var(--teal,#18664A)":"var(--border,#D4C9B5)"}`, borderRadius:14, padding:"20px 20px 16px", cursor:"pointer", boxShadow:"0 2px 10px rgba(11,29,51,.05)", transition:"all .18s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 6px 24px rgba(11,29,51,.12)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 2px 10px rgba(11,29,51,.05)"; e.currentTarget.style.transform=""; }}>
                  {i===0 && <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal,#18664A)", marginBottom:8 }}>🏆 Top ranked</div>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--navy,#0B1D33)", lineHeight:1.3, flex:1, marginRight:8 }}>{v.name||v.organization_name}</div>
                    {v.is_women_owned && <span style={{ fontSize:9, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"#db2777", background:"rgba(244,114,182,.1)", padding:"3px 8px", borderRadius:99, flexShrink:0 }}>Women-led</span>}
                  </div>
                  {v.location && <div style={{ fontSize:12, color:"var(--muted,#67788D)", marginBottom:8 }}>📍 {v.location}</div>}
                  {v.description && <div style={{ fontSize:12, color:"var(--muted,#67788D)", lineHeight:1.5, marginBottom:10 }}>{v.description?.slice(0,70)}…</div>}
                  {/* AI match reason */}
                  {aiMatch[id] && <div style={{ fontSize:11, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"5px 8px", borderRadius:6, marginBottom:10, lineHeight:1.45 }}>✨ {aiMatch[id]}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:esgColor, background:`${esgColor}12`, padding:"3px 8px", borderRadius:99 }}>ESG {esg}/100</span>
                    {v.esg_band && <span style={{ fontSize:11, color:"var(--muted,#67788D)" }}>{v.esg_band}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Vendor detail modal */}
      <Modal open={!!selected} onClose={()=>{setSelected(null);setDetail(null);}} title="Vendor profile" width={580}>
        {detailLoading
          ? <div style={{ textAlign:"center", padding:"40px" }}><span className="spinner" style={{width:32,height:32}}/></div>
          : detail ? (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Header */}
              <div style={{ background:"var(--navy,#0B1D33)", borderRadius:12, padding:"20px 24px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--cream,#F2EBD9)", marginBottom:6 }}>
                  {detail.profile?.organization_name||selected?.name}
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  {detail.profile?.is_women_owned && <span style={{ fontSize:10, fontWeight:700, color:"#f9a8d4", background:"rgba(244,114,182,.2)", padding:"2px 8px", borderRadius:99 }}>Women-owned</span>}
                  {detail.profile?.location && <span style={{ fontSize:12, color:"rgba(242,235,217,.6)" }}>📍 {detail.profile.location}</span>}
                  {detail.profile?.esg_band && <span style={{ fontSize:12, fontWeight:700, color:"#5FCFA0" }}>🌱 {detail.profile.esg_band} ({detail.profile.esg_score}/100)</span>}
                  {detail.rating?.average_rating > 0 && <span style={{ fontSize:12, color:"#F5B342" }}>⭐ {detail.rating.average_rating.toFixed(1)} ({detail.rating.total_reviews} reviews)</span>}
                </div>
              </div>
              {detail.profile?.impact_statement && (
                <div style={{ padding:"12px 16px", background:"var(--teal-bg,#E4F2EB)", borderRadius:10, border:"1px solid rgba(24,102,74,.2)", fontSize:14, color:"var(--teal,#18664A)", lineHeight:1.7, fontStyle:"italic" }}>
                  "{detail.profile.impact_statement}"
                </div>
              )}
              {detail.profile?.description && (
                <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.7, padding:"14px 16px", background:"var(--cream,#F2EBD9)", borderRadius:10 }}>
                  {detail.profile.description}
                </div>
              )}
              {detail.esg?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:12 }}>ESG impact</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {[
                      { l:"Jobs created", v:detail.esg[0].jobs_created||0, c:"var(--teal,#18664A)", i:"👷" },
                      { l:"Women employed", v:`${detail.esg[0].women_employees_pct||0}%`, c:"#db2777", i:"👩" },
                      { l:"ESG score", v:`${detail.esg[0].esg_score}/100`, c:"#5FCFA0", i:"🌱" },
                    ].map(m=>(
                      <div key={m.l} style={{ padding:14, background:"var(--cream,#F2EBD9)", borderRadius:10, textAlign:"center" }}>
                        <div style={{ fontSize:20, marginBottom:6 }}>{m.i}</div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:m.c, marginBottom:3 }}>{m.v||"—"}</div>
                        <div style={{ fontSize:11, color:"var(--muted,#67788D)" }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        }
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────── Shared ── */
function AIBtn({ loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", color:"var(--teal,#18664A)", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, cursor:loading?"wait":"pointer", display:"inline-flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
      {loading ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Generating…</> : <>✨ AI generate</>}
    </button>
  );
}
