import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "./Chatbot";
import { useState } from "react";

const NAV_ITEMS = {
  vendor: [
    { id:"home",          label:"Home",          icon:"home",      path:"/dashboard" },
    { id:"profile",       label:"Profile",       icon:"user",      path:"/dashboard/profile" },
    { id:"services",      label:"Services",      icon:"grid",      path:"/dashboard/services" },
    { id:"opportunities", label:"Opportunities", icon:"search",    path:"/dashboard/opportunities" },
    { id:"messages",      label:"Messages",      icon:"send",      path:"/messages" },
    { id:"esg",           label:"ESG Score",     icon:"leaf",      path:"/dashboard/esg" },
  ],
  buyer: [
    { id:"home",          label:"Home",          icon:"home",      path:"/dashboard" },
    { id:"requests",      label:"My RFPs",       icon:"clipboard", path:"/dashboard/requests" },
    { id:"vendors",       label:"Find Vendors",  icon:"search",    path:"/dashboard/vendors" },
  ],
  admin: [
    { id:"overview",      label:"Overview",      icon:"home",      path:"/dashboard" },
    { id:"approvals",     label:"Approvals",     icon:"check",     path:"/dashboard/approvals" },
    { id:"users",         label:"Users",         icon:"users",     path:"/dashboard/users" },
    { id:"impact",        label:"Impact",        icon:"chart",     path:"/dashboard/impact" },
    { id:"notify",        label:"Notify Users",  icon:"bell",      path:"/dashboard/notify" },
  ],
};

const ICONS = {
  home:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 6.5L7.5 1.5L13.5 6.5V13H9.5V9.5H5.5V13H1.5V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  user:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-2.5 2.5-4.5 5.5-4.5S13 10.5 13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  grid:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  file:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 1.5H9L12 4.5V13.5H3.5V1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V4.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 7h4M5.5 9.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  leaf:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 2.5C12.5 2.5 12 8 8 10C5 11.5 2.5 12.5 2.5 12.5C2.5 12.5 3 7.5 7 5.5C10 4 12.5 2.5 12.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M2.5 12.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  search:    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  send:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13 2L1 6.5L6 8.5M13 2L9 14L6 8.5M13 2L6 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  bell:      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5C5 1.5 3.5 3.5 3.5 6V9L2 11H13L11.5 9V6C11.5 3.5 10 1.5 7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 11.5C6 12.3 6.7 13 7.5 13S9 12.3 9 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  clipboard: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="3" y="2" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 2V3.5H9.5V2M5 6.5h5M5 9h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  check:     <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users:     <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2 2-3.5 4.5-3.5S10 11 10 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="10.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M11 9.5c1.8.3 3 1.5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  chart:     <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 12L5 8l3 2 3-5 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");

  const role  = user?.role || "vendor";
  const items = NAV_ITEMS[role] || NAV_ITEMS.vendor;
  // Default tab id depends on role — vendor/buyer use "home", admin uses "overview"
  const defaultId = role === "admin" ? "overview" : "home";
  const activeId = (() => {
    const seg = location.pathname.split("/")[2];
    return (!seg || seg === "dashboard") ? defaultId : seg;
  })();

  const sideW = collapsed ? 64 : 240;

  return (
    <div className="commerce-shell" style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: sideW, flexShrink:0,
        background: "var(--sidebar-bg, var(--navy))",
        borderRight: "1px solid var(--sidebar-border, rgba(255,255,255,0.07))",
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh",
        transition:"width 0.25s cubic-bezier(.4,0,.2,1)",
        zIndex:50, overflow:"hidden",
      }}>

        {/* Brand */}
        <div style={{
          padding: collapsed ? "20px 16px" : "22px 20px",
          borderBottom: "1px solid var(--sidebar-border, rgba(255,255,255,0.07))",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, overflow:"hidden" }}>
            <div style={{
              width:30, height:30, borderRadius:7, flexShrink:0,
              background:"linear-gradient(135deg,#7C3AED,#A855F7)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L12 4.5V8.5L6.5 12L1 8.5V4.5L6.5 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && (
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontWeight:900, fontSize:14, color:"var(--navy,#24122F)", whiteSpace:"nowrap", lineHeight:1.2 }}>Even Marketplace</div>
                <div style={{ fontSize:10, color:"var(--sidebar-text)", marginTop:2, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{role} workspace</div>
              </div>
            )}
          </div>
          <button onClick={()=>setCollapsed(c=>!c)} style={{
            background:"none", border:"none", cursor:"pointer",
            color:"var(--sidebar-text)", flexShrink:0, padding:4, borderRadius:5,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"color 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.color="var(--cream,white)"}
          onMouseLeave={e=>e.currentTarget.style.color="var(--sidebar-text)"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {collapsed
                ? <path d="M4 7h6M4 4h6M4 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                : <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              }
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto", overflowX:"hidden" }}>
          {items.map(item => {
            const isActive = activeId === item.id;
            return (
              <button key={item.id} onClick={()=>navigate(item.path)} title={collapsed ? item.label : undefined}
                style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding: collapsed ? "9px 14px" : "9px 12px",
                  borderRadius:7, border:"none",
                  background: isActive ? "var(--sidebar-active-bg, rgba(24,102,74,0.2))" : "transparent",
                  color: isActive ? "var(--sidebar-active-text, var(--teal-2))" : "var(--sidebar-text, rgba(242,235,217,0.55))",
                  cursor:"pointer", fontSize:13, fontWeight: isActive ? 600 : 400,
                  fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                  textAlign:"left", marginBottom:2, position:"relative",
                  borderLeft: isActive ? "2px solid var(--sidebar-accent, var(--teal))" : "2px solid transparent",
                  justifyContent: collapsed ? "center" : "flex-start",
                  whiteSpace:"nowrap",
                }}
                onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="var(--cream,rgba(242,235,217,0.85))"; } }}
                onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--sidebar-text, rgba(242,235,217,0.55))"; } }}>
                <span style={{ flexShrink:0, display:"flex", alignItems:"center" }}>{ICONS[item.icon]}</span>
                {!collapsed && <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User + signout */}
        <div style={{ padding:"10px 8px", borderTop:"1px solid var(--sidebar-border, rgba(255,255,255,0.07))" }}>
          {!collapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", marginBottom:4 }}>
              <div style={{
                width:28, height:28, borderRadius:"50%", flexShrink:0,
                background:"var(--sidebar-active-bg, rgba(24,102,74,0.3))",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:"var(--sidebar-active-text, var(--teal-2))",
                border:"1.5px solid rgba(255,255,255,0.1)",
              }}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
              <div style={{ overflow:"hidden", flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--cream,rgba(242,235,217,0.85))", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.name||"User"}</div>
                <div style={{ fontSize:10, color:"var(--sidebar-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email||""}</div>
              </div>
            </div>
          )}
          <button onClick={logout} title={collapsed ? "Sign out" : undefined}
            style={{
              width:"100%", padding: collapsed ? "9px 14px" : "8px 12px", borderRadius:7, border:"none",
              background:"transparent", color:"var(--sidebar-text, rgba(242,235,217,0.35))",
              cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif",
              display:"flex", alignItems:"center", gap:8, transition:"all 0.15s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(184,66,50,0.15)"; e.currentTarget.style.color="var(--red,#f87171)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--sidebar-text, rgba(242,235,217,0.35))"; }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 7h7M9 4.5L11.5 7 9 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 2H2.5A1 1 0 0 0 1.5 3v8a1 1 0 0 0 1 1H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          minHeight:70, background:"var(--surface)",
          borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 28px", position:"sticky", top:0, zIndex:40,
          boxShadow:"var(--shadow-sm)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
            {role==="buyer" ? <form onSubmit={e=>{e.preventDefault();const q=marketSearch.trim();if(q)sessionStorage.setItem("buyerProcurementQuery",q);navigate("/dashboard/vendors");}} style={{display:"flex",alignItems:"center",background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:12,padding:"0 12px",width:"min(620px,70vw)",height:44}}>
              <span style={{color:"#6B7280",display:"flex"}}>{ICONS.search}</span>
              <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="Search services, suppliers or locations" style={{flex:1,border:"none",outline:"none",background:"transparent",padding:"0 10px",fontSize:14,color:"#24122F"}}/>
              <button type="submit" style={{border:"none",background:"#0C831F",color:"white",borderRadius:8,padding:"7px 12px",fontWeight:800,cursor:"pointer"}}>Search</button>
            </form> : <div>
              <div style={{fontSize:15,fontWeight:900,color:"var(--navy,#24122F)"}}>{role==="vendor"?"Grow your storefront":"Marketplace operations"}</div>
              <div style={{fontSize:11,color:"var(--muted,#6B7280)",marginTop:2}}>{new Date().toLocaleDateString("en-IN",{ weekday:"long", month:"short", day:"numeric" })}</div>
            </div>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {role==="buyer" && <button onClick={()=>navigate("/dashboard/requests")} style={{border:"1px solid #E5E7EB",background:"white",borderRadius:10,padding:"9px 12px",fontSize:12,fontWeight:800,color:"#24122F",cursor:"pointer"}}>My requests</button>}
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"var(--teal-bg, rgba(24,102,74,0.1))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"var(--teal, var(--accent))",
              border:"1.5px solid var(--border2)",
            }}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex:1, padding:"24px 28px 40px", overflowY:"auto", animation:"fadeIn 0.3s ease", maxWidth:1600, width:"100%", margin:"0 auto" }}>
          {children}
        </main>
      </div>

      <Chatbot/>
    </div>
  );
}
