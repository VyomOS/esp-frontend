import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Btn, Input, Textarea, Select, Modal, Empty } from "../components/UI";
import ConfirmModal from "../components/ConfirmModal";
import { useLocation, useNavigate } from "react-router-dom";

/* ─────────────────────────────────── helpers ── */
const adminName = () => localStorage.getItem("name") || "Admin";
const relTime = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

/* ─────────────────────────────────── REJECT FORM (module-level) ── */
const REJECT_TEMPLATES = [
  "Document image is blurry — please re-upload a clear photo.",
  "Wrong document uploaded — please upload the correct document type.",
  "Document appears expired — please upload a valid, current document.",
  "PAN number on document does not match the registered details.",
  "GST certificate is for a different business entity.",
];

function RejectVendorForm({ vendor, onReject, onClose }) {
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try { await onReject(reason); } finally { setLoading(false); }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"var(--red-bg,#FAEBE8)", border:"1px solid rgba(184,66,50,.2)", borderRadius:10, padding:"14px 16px", fontSize:13, color:"var(--body,#253446)", lineHeight:1.6 }}>
        Rejecting <strong style={{ color:"var(--navy,#0B1D33)" }}>{vendor?.organization_name}</strong>. They will receive an email with your reason and can re-upload documents.
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:8 }}>Quick templates</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {REJECT_TEMPLATES.map((t,i)=>(
            <button key={i} onClick={()=>setReason(t)}
              style={{ textAlign:"left", padding:"9px 13px", borderRadius:8, border:`1.5px solid ${reason===t?"var(--red,#B84232)":"var(--border,#D4C9B5)"}`, background:reason===t?"var(--red-bg,#FAEBE8)":"white", fontSize:12, color:reason===t?"var(--red,#B84232)":"var(--body,#253446)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", lineHeight:1.4 }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", display:"block", marginBottom:6 }}>Custom reason</label>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Or write your own reason…"
          style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", resize:"vertical", lineHeight:1.6 }}/>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:"11px", background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, fontSize:13, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
        <button onClick={handle} disabled={loading||!reason.trim()}
          style={{ flex:1, padding:"11px", background:"var(--red,#B84232)", border:"none", borderRadius:6, fontSize:13, fontWeight:600, color:"white", cursor:loading||!reason.trim()?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:!reason.trim()?.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading?<><span className="spinner" style={{width:13,height:13}}/> Sending…</>:"Send rejection"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── VENDOR APPROVAL CARD (module-level) ── */
function VendorApprovalCard({ vendor, onVerify, onReject, toast }) {
  const [expanded, setExpanded]     = useState(false);
  const [docs, setDocs]             = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [aiCheck, setAiCheck]       = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [docUpdating, setDocUpdating] = useState("");
  const [rejectDocId, setRejectDocId] = useState(null);
  const [docRejectNote, setDocRejectNote] = useState("");

  const loadDocs = async () => {
    if (docs.length > 0) { setExpanded(e=>!e); return; }
    setExpanded(true); setDocsLoading(true);
    try {
      const r = await adminAPI.vendorDocuments(vendor.vendor_id);
      setDocs(r.data);
    } catch { toast.error("Failed to load documents"); }
    finally { setDocsLoading(false); }
  };

  const aiDocCheck = async () => {
    setAiLoading(true);
    try {
      const r = await adminAPI.aiDocCheck({ vendor_id: vendor.vendor_id });
      const d = r.data;
      const issues = d.issues?.map(i=>`${i.severity}: ${i.issue}`).join("; ") || "";
      setAiCheck(`${d.summary}${issues ? " Issues: " + issues : ""}`);
    } catch { toast.error("AI unavailable"); }
    finally { setAiLoading(false); }
  };

  const kycOverride = async (type, action) => {
    try {
      if (type === "gstin") {
        if (action === "verify") await adminAPI.verifyGstin(vendor.vendor_id);
        else await adminAPI.unverifyGstin(vendor.vendor_id);
      } else {
        if (action === "verify") await adminAPI.verifyPan(vendor.vendor_id);
        else await adminAPI.unverifyPan(vendor.vendor_id);
      }
      toast.success(`${type.toUpperCase()} ${action}d`);
    } catch { toast.error("KYC override failed"); }
  };

  const updateDoc = async (docId, status, note="") => {
    setDocUpdating(docId+status);
    try {
      await adminAPI.updateDocStatus(docId, { status, note });
      toast.success(`Document ${status}`);
      const r = await adminAPI.vendorDocuments(vendor.vendor_id);
      setDocs(r.data);
    } catch { toast.error("Failed"); }
    finally { setDocUpdating(""); }
  };

  const allVerified = docs.length > 0 && docs.every(d => d.status === "verified");
  const docStatusColor = { pending:"var(--amber,#B8720A)", verified:"var(--teal,#18664A)", rejected:"var(--red,#B84232)" };

  return (
    <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(11,29,51,.06)" }}>
      {/* Vendor header */}
      <div style={{ padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{vendor.organization_name}</span>
              {vendor.is_women_owned && <span style={{ fontSize:9, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#db2777", background:"rgba(244,114,182,.1)", padding:"2px 8px", borderRadius:99 }}>Women-led</span>}
            </div>
            <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:8 }}>
              {vendor.user_name} · <span style={{ color:"var(--navy,#0B1D33)" }}>{vendor.user_email}</span>
            </div>
            <div style={{ display:"flex", gap:12, fontSize:12, color:"var(--muted,#67788D)", flexWrap:"wrap" }}>
              {vendor.category && <span>📂 {vendor.category}</span>}
              {vendor.location  && <span>📍 {vendor.location}</span>}
              <span style={{ color: vendor.document_count > 0 ? "var(--teal,#18664A)" : "var(--amber,#B8720A)" }}>
                📄 {vendor.document_count} document{vendor.document_count!==1?"s":""}
              </span>
            </div>
            {vendor.description && (
              <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.55, marginTop:8, maxWidth:500 }}>
                {vendor.description.slice(0,140)}{vendor.description.length>140?"…":""}
              </div>
            )}
          </div>
          {/* Action buttons */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0, minWidth:130 }}>
            <button onClick={()=>onVerify(vendor)} disabled={vendor.document_count===0}
              style={{ background: vendor.document_count>0?"var(--teal,#18664A)":"var(--border,#D4C9B5)", color:"white", border:"none", borderRadius:6, padding:"9px 16px", fontSize:12, fontWeight:600, cursor:vendor.document_count>0?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", transition:"background .18s" }}
              onMouseEnter={e=>{ if(vendor.document_count>0) e.currentTarget.style.background="var(--teal-2,#22895F)"; }}
              onMouseLeave={e=>{ if(vendor.document_count>0) e.currentTarget.style.background="var(--teal,#18664A)"; }}>
              ✓ Verify vendor
            </button>
            <button onClick={()=>onReject(vendor)}
              style={{ background:"none", border:"1.5px solid var(--red,#B84232)", borderRadius:6, padding:"9px 16px", fontSize:12, fontWeight:600, color:"var(--red,#B84232)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="var(--red-bg,#FAEBE8)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; }}>
              ✕ Reject
            </button>
          </div>
        </div>

        {/* Expand documents + KYC overrides */}
        <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid var(--border,#D4C9B5)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <button onClick={loadDocs}
            style={{ background:"var(--cream,#F2EBD9)", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, color:"var(--navy,#0B1D33)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
            {expanded ? "▲ Hide documents" : `▼ Review ${vendor.document_count} document${vendor.document_count!==1?"s":""}`}
          </button>
          <button onClick={aiDocCheck} disabled={aiLoading}
            style={{ background:"var(--teal-bg,#E4F2EB)", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", cursor:aiLoading?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
            {aiLoading ? <><span className="spinner" style={{width:10,height:10,borderTopColor:"var(--teal)"}}/> Checking…</> : "✨ AI doc check"}
          </button>
          {/* Manual KYC overrides */}
          {vendor.gstin && (
            <button onClick={()=>kycOverride("gstin", vendor.gstin_verified?"unverify":"verify")}
              style={{ background:"none", border:`1px solid ${vendor.gstin_verified?"var(--muted,#67788D)":"var(--teal,#18664A)"}`, borderRadius:6, padding:"6px 11px", fontSize:11, fontWeight:600, color:vendor.gstin_verified?"var(--muted,#67788D)":"var(--teal,#18664A)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {vendor.gstin_verified ? "Unverify GST" : "✓ Verify GST"}
            </button>
          )}
          {vendor.pan && (
            <button onClick={()=>kycOverride("pan", vendor.pan_verified?"unverify":"verify")}
              style={{ background:"none", border:`1px solid ${vendor.pan_verified?"var(--muted,#67788D)":"var(--teal,#18664A)"}`, borderRadius:6, padding:"6px 11px", fontSize:11, fontWeight:600, color:vendor.pan_verified?"var(--muted,#67788D)":"var(--teal,#18664A)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {vendor.pan_verified ? "Unverify PAN" : "✓ Verify PAN"}
            </button>
          )}
          {allVerified && (
            <span style={{ fontSize:11, fontWeight:700, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"4px 10px", borderRadius:99 }}>✓ All documents verified</span>
          )}
        </div>

        {/* AI check result */}
        {aiCheck && (
          <div style={{ marginTop:12, background:"var(--navy,#0B1D33)", borderRadius:10, padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:14, flexShrink:0 }}>✨</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:4 }}>AI document review</div>
              <div style={{ fontSize:13, color:"rgba(242,235,217,.8)", lineHeight:1.6 }}>{aiCheck}</div>
            </div>
          </div>
        )}
      </div>

      {/* Inline documents panel */}
      {expanded && (
        <div style={{ borderTop:"1px solid var(--border,#D4C9B5)", background:"var(--cream,#F2EBD9)", padding:"16px 24px" }}>
          {docsLoading
            ? <div style={{ textAlign:"center", padding:"20px" }}><span className="spinner" style={{width:24,height:24,borderTopColor:"var(--teal)",borderColor:"rgba(24,102,74,.15)"}}/></div>
            : docs.length === 0
            ? <div style={{ fontSize:13, color:"var(--muted,#67788D)", textAlign:"center", padding:"16px" }}>No documents uploaded yet.</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {docs.map(d=>(
                  <div key={d.id} style={{ background:"white", borderRadius:10, padding:"14px 18px", border:`1.5px solid ${d.status==="verified"?"rgba(24,102,74,.25)":d.status==="rejected"?"rgba(184,66,50,.25)":"var(--border,#D4C9B5)"}`, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>📄</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--navy,#0B1D33)", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.original_name}</div>
                      <div style={{ display:"flex", gap:10, fontSize:11, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted,#67788D)" }}>{d.document_type}</span>
                        <span style={{ color:docStatusColor[d.status], fontWeight:700 }}>● {d.status}</span>
                        {d.file_size && <span style={{ color:"var(--muted,#67788D)" }}>{(d.file_size/1024).toFixed(0)} KB</span>}
                        {d.status_note && <span style={{ color:"var(--red,#B84232)" }}>Note: {d.status_note}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                      <a href={adminAPI.downloadDocument(d.id)} target="_blank" rel="noreferrer"
                        style={{ padding:"6px 12px", background:"var(--cream,#F2EBD9)", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, fontSize:11, fontWeight:600, color:"var(--navy,#0B1D33)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4 }}>
                        ⬇ View
                      </a>
                      {d.status !== "verified" && (
                        <button onClick={()=>updateDoc(d.id,"verified")} disabled={docUpdating===d.id+"verified"}
                          style={{ padding:"6px 12px", background:"var(--teal-bg,#E4F2EB)", border:"none", borderRadius:6, fontSize:11, fontWeight:600, color:"var(--teal,#18664A)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                          {docUpdating===d.id+"verified"?"…":"✓ Verify"}
                        </button>
                      )}
                      {d.status !== "rejected" && (
                        rejectDocId === d.id
                          ? (
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              <input value={docRejectNote} onChange={e=>setDocRejectNote(e.target.value)} placeholder="Reason…"
                                style={{ padding:"5px 10px", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:5, outline:"none", width:160 }}/>
                              <button onClick={async()=>{ await updateDoc(d.id,"rejected",docRejectNote); setRejectDocId(null); setDocRejectNote(""); }}
                                style={{ padding:"5px 10px", background:"var(--red,#B84232)", border:"none", borderRadius:5, fontSize:11, fontWeight:600, color:"white", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Send</button>
                              <button onClick={()=>setRejectDocId(null)}
                                style={{ padding:"5px 8px", background:"none", border:"1px solid var(--border,#D4C9B5)", borderRadius:5, fontSize:11, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={()=>{ setRejectDocId(d.id); setDocRejectNote(""); }}
                              style={{ padding:"6px 12px", background:"none", border:"1.5px solid var(--red,#B84232)", borderRadius:6, fontSize:11, fontWeight:600, color:"var(--red,#B84232)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                              ✕ Reject
                            </button>
                          )
                      )}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── USER ROW (module-level) ── */
function UserRow({ user, onActivate, onDeactivate }) {
  const roleColor  = { vendor:"var(--teal,#18664A)", buyer:"#6384ff", admin:"var(--amber,#B8720A)" };
  const roleBg     = { vendor:"var(--teal-bg,#E4F2EB)", buyer:"rgba(99,132,255,.1)", admin:"var(--amber-bg,#FDF3E4)" };
  return (
    <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
      {/* Avatar */}
      <div style={{ width:38, height:38, borderRadius:"50%", background:`${roleColor[user.role]||"var(--muted,#67788D)"}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:roleColor[user.role]||"var(--muted,#67788D)" }}>
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
          <span style={{ fontSize:14, fontWeight:600, color:"var(--navy,#0B1D33)" }}>{user.name}</span>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:roleColor[user.role], background:roleBg[user.role], padding:"2px 8px", borderRadius:99 }}>{user.role}</span>
          {!user.is_active && <span style={{ fontSize:10, fontWeight:700, color:"var(--red,#B84232)", background:"var(--red-bg,#FAEBE8)", padding:"2px 8px", borderRadius:99 }}>Inactive</span>}
          {user.verified && <span style={{ fontSize:10, fontWeight:700, color:"var(--teal,#18664A)", background:"var(--teal-bg,#E4F2EB)", padding:"2px 8px", borderRadius:99 }}>KYC ✓</span>}
        </div>
        <div style={{ fontSize:12, color:"var(--muted,#67788D)" }}>
          {user.email} · Joined {new Date(user.created_at).toLocaleDateString()}
          {!user.email_verified && <span style={{ color:"var(--amber,#B8720A)", marginLeft:6 }}>· Email unverified</span>}
        </div>
      </div>
      <div style={{ flexShrink:0 }}>
        {user.is_active
          ? <button onClick={()=>onDeactivate(user)}
              style={{ padding:"7px 14px", background:"none", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, fontSize:12, fontWeight:600, color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--red,#B84232)"; e.currentTarget.style.color="var(--red,#B84232)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border,#D4C9B5)"; e.currentTarget.style.color="var(--muted,#67788D)"; }}>
              Deactivate
            </button>
          : <button onClick={()=>onActivate(user)}
              style={{ padding:"7px 14px", background:"var(--teal-bg,#E4F2EB)", border:"none", borderRadius:6, fontSize:12, fontWeight:600, color:"var(--teal,#18664A)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Activate
            </button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────── ESG BAR (module-level) ── */
function EsgBar({ label, value, max, color }) {
  const pct = Math.min((value / (max||1)) * 100, 100);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:13, color:"var(--body,#253446)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"60%" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color:color||"var(--navy,#0B1D33)", flexShrink:0, marginLeft:8 }}>{value}</span>
      </div>
      <div style={{ background:"var(--cream-mid,#E9DFC6)", borderRadius:99, height:7, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color||"var(--teal,#18664A)", borderRadius:99, transition:"width 1s cubic-bezier(.4,0,.2,1)" }}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Main router ── */
export default function AdminDashboard() {
  const loc   = useLocation();
  const nav   = useNavigate();
  const toast = useToast();
  const tab = loc.pathname.includes("approvals")    ? "approvals"
    : loc.pathname.includes("users")                ? "users"
    : loc.pathname.includes("impact")               ? "impact"
    : loc.pathname.includes("notify")               ? "notify"
    : loc.pathname.includes("analytics")            ? "analytics"
    : "overview";

  return (
    <Layout>
      <div style={{ display:"flex", gap:0, borderBottom:"1.5px solid var(--border,#D4C9B5)", marginBottom:28, flexWrap:"wrap" }}>
        {[
          { id:"overview",  label:"Overview",   icon:"⬡" },
          { id:"approvals", label:"Approvals",  icon:"◈" },
          { id:"users",     label:"Users",      icon:"◇" },
          { id:"impact",    label:"Impact",     icon:"🌱" },
          { id:"notify",    label:"Notify",     icon:"📢" },
          { id:"analytics", label:"Analytics",  icon:"📊" },
        ].map(t=>{
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={()=>nav(t.id==="overview"?"/dashboard":`/dashboard/${t.id}`)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:active?"var(--navy,#0B1D33)":"var(--text3,#67788D)", borderBottom:`2px solid ${active?"var(--teal,#18664A)":"transparent"}`, marginBottom:"-1.5px", transition:"all .16s" }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      {tab==="overview"  && <AdminOverview  toast={toast} nav={nav}/>}
      {tab==="approvals" && <AdminApprovals toast={toast}/>}
      {tab==="users"     && <AdminUsers     toast={toast}/>}
      {tab==="impact"    && <AdminImpact    toast={toast}/>}
      {tab==="notify"    && <AdminNotify    toast={toast}/>}
      {tab==="analytics" && <AdminAnalytics toast={toast}/>}
    </Layout>
  );
}

/* ─────────────────────────────────── OVERVIEW ── */
function AdminOverview({ toast, nav }) {
  const [stats, setStats]     = useState(null);
  const [pending, setPending] = useState([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.allSettled([adminAPI.stats(), adminAPI.pendingVendors(), adminAPI.aiPlatformInsight()])
      .then(([s,p,ai])=>{
        const st = s.status==="fulfilled" ? s.value.data : null;
        const pe = p.status==="fulfilled" ? p.value.data : [];
        setStats(st); setPending(pe);
        if (ai.status==="fulfilled") {
          const d = ai.value.data;
          setInsight(d.insight || d.headline || "");
        }
      }).finally(()=>setLoading(false));
  },[]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:90,borderRadius:12}}/>)}
    </div>
  );

  const statCards = [
    { label:"Total users",       value: stats?.total_users||0,      color:"var(--navy,#0B1D33)" },
    { label:"Verified vendors",  value: stats?.verified_vendors||0, color:"var(--teal,#18664A)" },
    { label:"Active RFPs",       value: stats?.active_requests||0,  color:"#6384ff" },
    { label:"Total buyers",      value: stats?.total_buyers||0,     color:"var(--amber,#B8720A)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22, animation:"fadeUp .4s ease" }}>

      {/* Hero */}
      <div style={{ background:"var(--navy,#0B1D33)", borderRadius:16, padding:"28px 32px", display:"grid", gridTemplateColumns:"1fr auto", gap:32, alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-60, top:-60, width:240, height:240, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:8 }}>Platform overview</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(18px,2.5vw,26px)", fontWeight:700, color:"var(--cream,#F2EBD9)", marginBottom:10 }}>
            Good {new Date().getHours()<12?"morning":"afternoon"}, {adminName().split(" ")[0]}.
          </h1>
          {insight
            ? <p style={{ fontSize:13, color:"rgba(242,235,217,.65)", lineHeight:1.7, maxWidth:460, marginBottom:0 }}>{insight}</p>
            : <p style={{ fontSize:13, color:"rgba(242,235,217,.4)", lineHeight:1.7 }}>Loading AI platform summary…</p>
          }
        </div>
        {/* Pending badge */}
        {pending.length > 0 && (
          <button onClick={()=>nav("/dashboard/approvals")}
            style={{ background:"var(--red,#B84232)", border:"none", borderRadius:12, padding:"20px 24px", textAlign:"center", cursor:"pointer", position:"relative", zIndex:1, flexShrink:0, transition:"background .18s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#9a3628"}
            onMouseLeave={e=>e.currentTarget.style.background="var(--red,#B84232)"}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:700, color:"white", lineHeight:1 }}>{pending.length}</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.7)", marginTop:4 }}>Pending approvals</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:4 }}>Tap to review →</div>
          </button>
        )}
        {pending.length === 0 && (
          <div style={{ background:"rgba(24,102,74,.3)", border:"1px solid rgba(24,102,74,.3)", borderRadius:12, padding:"20px 24px", textAlign:"center", position:"relative", zIndex:1, flexShrink:0 }}>
            <div style={{ fontSize:28, marginBottom:4 }}>✓</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#5FCFA0" }}>All caught up</div>
            <div style={{ fontSize:11, color:"rgba(242,235,217,.4)", marginTop:3 }}>No pending approvals</div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
        {statCards.map(s=>(
          <div key={s.label} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"18px 22px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:10 }}>{s.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:12 }}>Quick actions</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {[
            { label:"Review pending vendors", desc:`${pending.length} waiting`, tab:"approvals", icon:"◈", urgent: pending.length>0 },
            { label:"Manage all users",       desc:`${stats?.total_users||0} registered`, tab:"users",     icon:"◇", urgent:false },
            { label:"View platform impact",   desc:"ESG + jobs data", tab:"impact",    icon:"🌱", urgent:false },
            { label:"Send a notification",    desc:"Broadcast to users", tab:"notify",    icon:"📢", urgent:false },
          ].map(q=>(
            <button key={q.tab} onClick={()=>nav(`/dashboard/${q.tab}`)}
              style={{ background:"white", border:`1.5px solid ${q.urgent?"var(--red,#B84232)":"var(--border,#D4C9B5)"}`, borderRadius:12, padding:"16px 18px", textAlign:"left", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 4px 16px rgba(11,29,51,.10)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform=""; }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{q.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color: q.urgent?"var(--red,#B84232)":"var(--navy,#0B1D33)", marginBottom:3 }}>{q.label}</div>
              <div style={{ fontSize:12, color:"var(--muted,#67788D)" }}>{q.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── APPROVALS ── */
function AdminApprovals({ toast }) {
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [confirmVerify, setConfirmVerify] = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = () => { setSelected(new Set()); adminAPI.pendingVendors().then(r=>setVendors(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);

  const reject = async (reason) => {
    try { await adminAPI.rejectVendor(rejectTarget.vendor_id, reason); toast.success("Vendor rejected"); setRejectTarget(null); load(); }
    catch { toast.error("Failed"); }
  };

  const bulkVerify = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const r = await adminAPI.bulkVerify({ vendor_ids: [...selected] });
      toast.success(`Verified ${r.data.verified} · Skipped ${r.data.skipped}`);
      load();
    } catch { toast.error("Bulk verify failed"); }
    finally { setBulkLoading(false); }
  };

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120,borderRadius:14}}/>)}
    </div>
  );

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Vendor approvals</h2>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>
            {vendors.length > 0
              ? <><span style={{ color:"var(--red,#B84232)", fontWeight:700 }}>{vendors.length} pending</span> · Review documents before verifying</>
              : "All vendors reviewed — no pending approvals"}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {selected.size > 0 && (
            <button onClick={bulkVerify} disabled={bulkLoading}
              style={{ background:"var(--teal,#18664A)", color:"white", border:"none", borderRadius:6, padding:"8px 16px", fontSize:12, fontWeight:600, cursor:bulkLoading?"wait":"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
              {bulkLoading ? <><span className="spinner" style={{width:10,height:10}}/> Verifying…</> : `✓ Bulk verify (${selected.size})`}
            </button>
          )}
          {vendors.length > 0 && (
            <div style={{ fontSize:12, color:"var(--muted,#67788D)", background:"var(--red-bg,#FAEBE8)", padding:"6px 14px", borderRadius:99, fontWeight:600 }}>
              ⏳ {vendors.length} awaiting review
            </div>
          )}
        </div>
      </div>

      {vendors.length === 0
        ? <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"48px", textAlign:"center", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:.35 }}>✓</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:6 }}>All caught up!</div>
            <div style={{ fontSize:13, color:"var(--muted,#67788D)" }}>No vendors are pending verification.</div>
          </div>
        : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {vendors.map(v=>(
              <div key={v.vendor_id} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <label style={{ paddingTop:22, cursor:"pointer", flexShrink:0 }}>
                  <input type="checkbox" checked={selected.has(v.vendor_id)} onChange={()=>toggleSelect(v.vendor_id)}
                    style={{ width:16, height:16, accentColor:"var(--teal,#18664A)", cursor:"pointer" }}/>
                </label>
                <div style={{ flex:1 }}>
                  <VendorApprovalCard vendor={v}
                    onVerify={(v)=>setConfirmVerify(v)}
                    onReject={(v)=>setRejectTarget(v)}
                    toast={toast}/>
                </div>
              </div>
            ))}
          </div>
      }

      {/* Confirm verify */}
      <ConfirmModal open={!!confirmVerify} onClose={()=>setConfirmVerify(null)}
        onConfirm={async()=>{ await adminAPI.verifyVendor(confirmVerify.vendor_id); toast.success("Vendor verified and notified!"); setConfirmVerify(null); load(); }}
        title="Verify vendor" message={`Verify ${confirmVerify?.organization_name}? They will receive a confirmation email.`} variant="success"/>

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={()=>setRejectTarget(null)} title={`Reject — ${rejectTarget?.organization_name}`} width={500}>
        <RejectVendorForm vendor={rejectTarget} onReject={reject} onClose={()=>setRejectTarget(null)}/>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────── USERS ── */
function AdminUsers({ toast }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const load = () => adminAPI.listUsers().then(r=>setUsers(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const activate   = async (u) => { await adminAPI.updateUser(u.id,{is_active:true});  toast.success("User activated");   load(); };
  const deactivate = async (u) => { await adminAPI.deactivateUser(u.id);               toast.success("User deactivated"); setConfirmDeactivate(null); load(); };

  const filtered = users.filter(u=>{
    const q = search.toLowerCase();
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchQ    = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchQ;
  });

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:68,borderRadius:10}}/>)}
    </div>
  );

  return (
    <div style={{ animation:"fadeUp .4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>User management</h2>
          <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>{users.length} registered users</p>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name or email…"
          style={{ flex:1, minWidth:200, padding:"10px 16px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"white", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:8, outline:"none" }}/>
        <div style={{ display:"flex", gap:6 }}>
          {[{v:"",l:"All"},{v:"vendor",l:"Vendors"},{v:"buyer",l:"Buyers"},{v:"admin",l:"Admins"}].map(r=>(
            <button key={r.v} onClick={()=>setRoleFilter(r.v)}
              style={{ padding:"9px 16px", borderRadius:99, border:`1.5px solid ${roleFilter===r.v?"var(--navy,#0B1D33)":"var(--border,#D4C9B5)"}`, background:roleFilter===r.v?"var(--navy,#0B1D33)":"white", color:roleFilter===r.v?"var(--cream,#F2EBD9)":"var(--muted,#67788D)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {filtered.length === 0
        ? <Empty icon="◇" title="No users found" desc="Try a different search term or filter"/>
        : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map(u=>(
              <UserRow key={u.id} user={u} onActivate={activate} onDeactivate={(u)=>setConfirmDeactivate(u)}/>
            ))}
          </div>
      }
      <div style={{ marginTop:14, fontSize:12, color:"var(--muted,#67788D)", textAlign:"right" }}>
        Showing {filtered.length} of {users.length} users
      </div>

      <ConfirmModal open={!!confirmDeactivate} onClose={()=>setConfirmDeactivate(null)}
        onConfirm={()=>deactivate(confirmDeactivate)}
        title="Deactivate user" message={`Deactivate ${confirmDeactivate?.name}? They will no longer be able to log in.`} variant="danger"/>
    </div>
  );
}

/* ─────────────────────────────────── IMPACT ── */
function AdminImpact({ toast }) {
  const [impact, setImpact]       = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [aiStory, setAiStory]     = useState("");
  const [loading, setLoading]     = useState(true);

  useEffect(()=>{
    Promise.allSettled([adminAPI.impact(), adminAPI.esgBreakdown(), adminAPI.aiImpactStory()])
      .then(([imp,brk,story])=>{
        const i = imp.status==="fulfilled" ? imp.value.data : null;
        const b = brk.status==="fulfilled" ? brk.value.data : [];
        setImpact(i); setBreakdown(b);
        if (story.status==="fulfilled") {
          const d = story.value.data;
          setAiStory(d.story || "");
        }
      }).finally(()=>setLoading(false));
  },[]);

  if (loading) return <div className="skeleton" style={{height:400,borderRadius:12}}/>;

  const maxJobs = Math.max(...breakdown.map(b=>b.jobs||0), 1);
  const maxWomen = Math.max(...breakdown.map(b=>b.women||0), 1);

  return (
    <div style={{ animation:"fadeUp .4s ease", display:"flex", flexDirection:"column", gap:22 }}>
      {/* AI story hero */}
      {aiStory && (
        <div style={{ background:"var(--navy,#0B1D33)", borderRadius:14, padding:"24px 28px", display:"flex", gap:14, alignItems:"flex-start" }}>
          <span style={{ fontSize:20, flexShrink:0 }}>✨</span>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-2,#22895F)", marginBottom:6 }}>Platform impact story</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:"var(--cream,#F2EBD9)", lineHeight:1.6 }}>{aiStory}</div>
          </div>
        </div>
      )}

      {/* Big numbers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
        {[
          { label:"Verified vendors",  value:impact?.verified_vendors||0,       color:"var(--teal,#18664A)",    icon:"✓" },
          { label:"Jobs created",      value:impact?.total_jobs_created||0,      color:"#6384ff",                icon:"👷" },
          { label:"Women employed",    value:impact?.total_women_employed||0,    color:"#db2777",                icon:"👩" },
          { label:"Carbon saved (t)",  value:(impact?.total_carbon_saved||0).toFixed(1), color:"var(--teal,#18664A)", icon:"🌿" },
          { label:"Active RFPs",       value:impact?.total_requests||0,          color:"var(--amber,#B8720A)",   icon:"📋" },
          { label:"Total buyers",      value:impact?.total_buyers||0,            color:"var(--navy,#0B1D33)",    icon:"🏢" },
        ].map(s=>(
          <div key={s.label} style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:12, padding:"16px 20px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
            <div style={{ fontSize:18, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:s.color, lineHeight:1, marginBottom:5 }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted,#67788D)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vendor breakdown bars */}
      {breakdown.length > 0 && (
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"24px 28px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:20 }}>Vendor-level breakdown</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:14 }}>Jobs created</div>
              {breakdown.slice(0,8).map((b,i)=>(
                <EsgBar key={i} label={b.vendor} value={b.jobs||0} max={maxJobs} color="#6384ff"/>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:14 }}>Women employed</div>
              {breakdown.slice(0,8).map((b,i)=>(
                <EsgBar key={i} label={b.vendor} value={b.women||0} max={maxWomen} color="#db2777"/>
              ))}
            </div>
          </div>
          {breakdown.length > 0 && (
            <div style={{ marginTop:24, paddingTop:16, borderTop:"1px solid var(--border,#D4C9B5)" }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:14 }}>Carbon saved (tonnes CO₂)</div>
              {breakdown.slice(0,8).map((b,i)=>(
                <EsgBar key={i} label={b.vendor} value={Number(b.carbon||0).toFixed(1)} max={Math.max(...breakdown.map(x=>Number(x.carbon)||0),1)} color="var(--teal,#18664A)"/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── NOTIFY ── */
function AdminNotify({ toast }) {
  const [message, setMessage]   = useState("");
  const [target, setTarget]     = useState("all");
  const [type, setType]         = useState("info");
  const [sending, setSending]   = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails]     = useState([]);
  const [sent, setSent]         = useState(false);

  const addEmail = () => {
    const v = emailInput.trim().toLowerCase();
    if (!v) return;
    if (!v.includes("@")) { toast.error("Enter a valid email"); return; }
    if (emails.includes(v)) { toast.error("Already added"); return; }
    setEmails(p=>[...p,v]); setEmailInput("");
  };
  const removeEmail = e => setEmails(p=>p.filter(x=>x!==e));
  const handleKey   = e => { if (e.key==="Enter"||e.key===",") { e.preventDefault(); addEmail(); } };

  const send = async () => {
    if (!message.trim()) { toast.error("Enter a message"); return; }
    if (target==="individual" && emails.length===0) { toast.error("Add at least one email"); return; }
    setSending(true);
    try {
      const r = await adminAPI.sendNotification({ message, target, emails, type });
      toast.success(r.data.message);
      if (r.data.not_found?.length>0) toast.error(`Not found: ${r.data.not_found.join(", ")}`);
      setSent(true);
    } catch(err) { toast.error(err.response?.data?.detail||"Failed"); }
    finally { setSending(false); }
  };

  const reset = () => { setMessage(""); setEmails([]); setEmailInput(""); setSent(false); };

  const TYPES = [
    { id:"info",    label:"ℹ Info",    color:"#6384ff" },
    { id:"success", label:"✅ Success", color:"var(--teal,#18664A)" },
    { id:"warning", label:"⚠ Warning", color:"var(--amber,#B8720A)" },
  ];

  const TARGETS = [
    { id:"all",        label:"👥 Everyone",       desc:"All registered users" },
    { id:"vendors",    label:"🌱 All vendors",    desc:"Every vendor account" },
    { id:"buyers",     label:"🏢 All buyers",     desc:"Every buyer account" },
    { id:"individual", label:"👤 Specific users", desc:"Enter emails below" },
  ];

  return (
    <div style={{ maxWidth:600, animation:"fadeUp .4s ease" }}>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Send notification</h2>
        <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>Broadcast a message to users on the platform</p>
      </div>

      {sent ? (
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"48px", textAlign:"center", boxShadow:"0 2px 8px rgba(11,29,51,.05)", animation:"fadeUp .3s ease" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--teal-bg,#E4F2EB)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 13l5 5 11-11" stroke="var(--teal,#18664A)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:8 }}>Notification sent!</div>
          <div style={{ fontSize:13, color:"var(--muted,#67788D)", marginBottom:24, lineHeight:1.6 }}>
            {target==="all"?"Sent to all users":target==="vendors"?"Sent to all vendors":target==="buyers"?"Sent to all buyers":`Sent to ${emails.length} user${emails.length!==1?"s":""}`}
          </div>
          <button onClick={reset} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Send another
          </button>
        </div>
      ) : (
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"28px 32px", boxShadow:"0 2px 8px rgba(11,29,51,.05)", display:"flex", flexDirection:"column", gap:20 }}>

          {/* Target */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>Send to</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {TARGETS.map(t=>(
                <button key={t.id} onClick={()=>setTarget(t.id)}
                  style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${target===t.id?"var(--navy,#0B1D33)":"var(--border,#D4C9B5)"}`, background:target===t.id?"var(--navy,#0B1D33)":"white", cursor:"pointer", textAlign:"left", transition:"all .18s", fontFamily:"'DM Sans',sans-serif" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:target===t.id?"var(--cream,#F2EBD9)":"var(--navy,#0B1D33)", marginBottom:2 }}>{t.label}</div>
                  <div style={{ fontSize:11, color:target===t.id?"rgba(242,235,217,.55)":"var(--muted,#67788D)" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email input for individual */}
          {target==="individual" && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>Recipients</div>
              {emails.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"10px 12px", background:"var(--cream,#F2EBD9)", borderRadius:8, marginBottom:8, minHeight:44 }}>
                  {emails.map(e=>(
                    <div key={e} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 8px 4px 12px", background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:99, fontSize:12, color:"var(--navy,#0B1D33)" }}>
                      {e}
                      <button onClick={()=>removeEmail(e)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted,#67788D)", fontSize:14, lineHeight:1, display:"flex", alignItems:"center", padding:0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <input value={emailInput} onChange={e=>setEmailInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Enter email, press Enter or comma…"
                  style={{ flex:1, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none" }}/>
                <button onClick={addEmail} style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:6, padding:"10px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Add</button>
              </div>
              <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:6 }}>{emails.length} recipient{emails.length!==1?"s":""} added</div>
            </div>
          )}

          {/* Type */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:10 }}>Notification type</div>
            <div style={{ display:"flex", gap:8 }}>
              {TYPES.map(t=>(
                <button key={t.id} onClick={()=>setType(t.id)}
                  style={{ flex:1, padding:"9px 12px", borderRadius:8, border:`1.5px solid ${type===t.id?t.color:"var(--border,#D4C9B5)"}`, background:type===t.id?`${t.color}12`:"white", color:type===t.id?t.color:"var(--muted,#67788D)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12, transition:"all .18s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--navy,#0B1D33)", marginBottom:8 }}>Message *</div>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
              placeholder="Write your notification message…"
              style={{ width:"100%", padding:"11px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1.5px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", resize:"vertical", lineHeight:1.6 }}/>
          </div>

          {/* Preview */}
          {message && (
            <div style={{ background:"var(--cream,#F2EBD9)", borderRadius:10, padding:"14px 16px", border:"1px solid var(--border,#D4C9B5)" }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--muted,#67788D)", marginBottom:6 }}>Preview</div>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:16 }}>{type==="success"?"✅":type==="warning"?"⚠️":"ℹ️"}</span>
                <div style={{ fontSize:13, color:"var(--body,#253446)", lineHeight:1.6 }}>{message}</div>
              </div>
            </div>
          )}

          {/* Send button */}
          <button onClick={send} disabled={sending||!message.trim()}
            style={{ background:"var(--navy,#0B1D33)", color:"var(--cream,#F2EBD9)", border:"none", borderRadius:8, padding:"13px 20px", fontSize:14, fontWeight:600, cursor:sending||!message.trim()?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:!message.trim()?.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .18s" }}
            onMouseEnter={e=>{ if(message.trim()&&!sending) e.currentTarget.style.background="var(--teal,#18664A)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="var(--navy,#0B1D33)"; }}>
            {sending
              ? <><span className="spinner" style={{width:14,height:14}}/> Sending…</>
              : target==="all"        ? "📢 Broadcast to everyone"
              : target==="vendors"    ? "🌱 Send to all vendors"
              : target==="buyers"     ? "🏢 Send to all buyers"
              : `📨 Send to ${emails.length||0} user${emails.length!==1?"s":""}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── ANALYTICS ── */
function AdminAnalytics({ toast }) {
  const [vendorFunnel, setVendorFunnel] = useState(null);
  const [rfpFunnel, setRfpFunnel]       = useState(null);
  const [esgDist, setEsgDist]           = useState(null);
  const [aiUsage, setAiUsage]           = useState(null);
  const [auditLog, setAuditLog]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [auditFilter, setAuditFilter]   = useState("");

  useEffect(()=>{
    Promise.allSettled([
      adminAPI.analyticsVendorFunnel(),
      adminAPI.analyticsRfpFunnel(),
      adminAPI.analyticsEsgDistribution(),
      adminAPI.analyticsAiUsage(),
      adminAPI.auditLog({ limit: 30 }),
    ]).then(([vf,rf,ed,au,al])=>{
      if (vf.status==="fulfilled") setVendorFunnel(vf.value.data);
      if (rf.status==="fulfilled") setRfpFunnel(rf.value.data);
      if (ed.status==="fulfilled") setEsgDist(ed.value.data);
      if (au.status==="fulfilled") setAiUsage(au.value.data);
      if (al.status==="fulfilled") setAuditLog(al.value.data || []);
    }).finally(()=>setLoading(false));
  },[]);

  const loadAudit = (action="") => {
    setAuditFilter(action);
    adminAPI.auditLog({ action: action||undefined, limit: 30 })
      .then(r=>setAuditLog(r.data||[])).catch(()=>{});
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:100,borderRadius:12}}/>)}
    </div>
  );

  const FunnelBar = ({ stages }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {(stages||[]).map((s,i)=>{
        const max = stages[0]?.count || 1;
        const pct = Math.min((s.count/max)*100, 100);
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:140, fontSize:12, color:"var(--body,#253446)", flexShrink:0 }}>{s.stage||s.label}</div>
            <div style={{ flex:1, background:"var(--cream-mid,#E9DFC6)", borderRadius:99, height:8, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:"var(--teal,#18664A)", borderRadius:99, transition:"width 1s" }}/>
            </div>
            <div style={{ width:50, fontSize:13, fontWeight:700, color:"var(--navy,#0B1D33)", textAlign:"right" }}>{s.count}</div>
          </div>
        );
      })}
    </div>
  );

  const AUDIT_ACTIONS = ["","vendor.verified","vendor.rejected","bid.awarded","bid.declined","notification.broadcast","document.status_updated"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, animation:"fadeUp .4s ease" }}>
      <div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Platform analytics</h2>
        <p style={{ fontSize:13, color:"var(--muted,#67788D)", marginTop:4 }}>Funnels, ESG distribution, AI usage, and audit trail</p>
      </div>

      {/* Funnels */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"22px 26px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:16 }}>Vendor funnel</div>
          <FunnelBar stages={vendorFunnel?.stages || vendorFunnel}/>
        </div>
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"22px 26px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:16 }}>RFP funnel</div>
          <FunnelBar stages={rfpFunnel?.stages || rfpFunnel}/>
        </div>
      </div>

      {/* ESG distribution */}
      {esgDist && (
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"22px 26px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>ESG band distribution</div>
            {esgDist.platform_avg && <span style={{ fontSize:12, fontWeight:700, color:"var(--teal,#18664A)" }}>Platform avg: {esgDist.platform_avg.toFixed(1)}/100</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {(esgDist.bands || []).map(b=>(
              <div key={b.band} style={{ textAlign:"center", padding:"14px", background:"var(--cream,#F2EBD9)", borderRadius:10 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"var(--teal,#18664A)" }}>{b.count}</div>
                <div style={{ fontSize:11, color:"var(--muted,#67788D)", marginTop:4 }}>{b.band}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI usage */}
      {aiUsage && (
        <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"22px 26px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)", marginBottom:16 }}>AI endpoint usage</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {(aiUsage.endpoints || Object.entries(aiUsage).filter(([k])=>k!=="total_calls")).map((ep,i)=>{
              const label = Array.isArray(ep) ? ep[0] : ep.endpoint;
              const calls = Array.isArray(ep) ? ep[1] : ep.calls;
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"var(--cream,#F2EBD9)", borderRadius:8 }}>
                  <span style={{ fontSize:13, color:"var(--body,#253446)" }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--teal,#18664A)" }}>{calls} calls</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div style={{ background:"white", border:"1px solid var(--border,#D4C9B5)", borderRadius:14, padding:"22px 26px", boxShadow:"0 2px 8px rgba(11,29,51,.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--navy,#0B1D33)" }}>Audit log</div>
          <select value={auditFilter} onChange={e=>loadAudit(e.target.value)}
            style={{ padding:"6px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:"var(--cream,#F2EBD9)", color:"var(--navy,#0B1D33)", border:"1px solid var(--border,#D4C9B5)", borderRadius:6, outline:"none", cursor:"pointer" }}>
            {AUDIT_ACTIONS.map(a=><option key={a} value={a}>{a||"All actions"}</option>)}
          </select>
        </div>
        {auditLog.length === 0
          ? <div style={{ textAlign:"center", padding:"20px", color:"var(--muted,#67788D)", fontSize:13 }}>No audit entries found.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {auditLog.map((e,i)=>(
                <div key={i} style={{ display:"flex", gap:12, padding:"10px 14px", background:"var(--cream,#F2EBD9)", borderRadius:8, alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--navy,#0B1D33)" }}>{e.action}</span>
                      <span style={{ fontSize:11, color:"var(--muted,#67788D)" }}>by {e.actor_name}</span>
                      {e.target_type && <span style={{ fontSize:11, color:"var(--muted,#67788D)" }}>→ {e.target_type} #{e.target_id}</span>}
                    </div>
                    <div style={{ fontSize:11, color:"var(--muted,#67788D)" }}>{relTime(e.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
