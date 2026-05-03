import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "./Chatbot";
import ThemePicker from "./ThemePicker";

const navItems = {
  vendor: [
    { path: "/dashboard",            icon: "⬡", label: "Overview"        },
    { path: "/dashboard/profile",    icon: "◈", label: "My Profile"      },
    { path: "/dashboard/services",   icon: "◇", label: "Services"        },
    { path: "/dashboard/documents",  icon: "◻", label: "Documents"       },
    { path: "/dashboard/esg",        icon: "◉", label: "ESG Metrics"     },
    { path: "/dashboard/requests",   icon: "◈", label: "Browse Requests" },
  ],
  buyer: [
    { path: "/dashboard",               icon: "⬡", label: "Overview"       },
    { path: "/dashboard/my-requests",   icon: "◈", label: "My Requests"   },
    { path: "/dashboard/vendors",       icon: "◇", label: "Find Vendors"  },
    { path: "/dashboard/notifications", icon: "◻", label: "Notifications" },
  ],
  admin: [
    { path: "/dashboard",               icon: "⬡", label: "Overview"       },
    { path: "/dashboard/vendors",       icon: "◈", label: "Approvals"      },
    { path: "/dashboard/users",         icon: "◇", label: "Users"          },
    { path: "/dashboard/impact",        icon: "◉", label: "Impact"         },
    { path: "/dashboard/notifications", icon: "◻", label: "Notify Users"  },
  ],
};

export default function Layout({ children }) {
  const { logout }     = useAuth();
  const navigate       = useNavigate();
  const location       = useLocation();
  const [chatOpen, setChatOpen]     = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const role  = localStorage.getItem("role") || "buyer";
  const name  = localStorage.getItem("name") || "User";
  const items = navItems[role] || [];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ width:collapsed?72:240, background:"var(--bg2)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", transition:"width 0.3s ease", flexShrink:0, position:"sticky", top:0, height:"100vh", overflow:"hidden" }}>
        {/* Logo */}
        <div style={{ padding:collapsed?"20px 16px":"24px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:"var(--accent)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"Syne", fontWeight:800, fontSize:16, color:"white" }}>E</div>
          {!collapsed&&<div><div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,letterSpacing:"-0.5px"}}>ESP</div><div style={{fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1}}>Platform</div></div>}
        </div>

        {/* Role badge */}
        {!collapsed&&<div style={{padding:"10px 20px",borderBottom:"1px solid var(--border)"}}><span className={`badge ${role==="admin"?"danger":role==="vendor"?"active":"verified"}`}>{role}</span></div>}

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
          {items.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={()=>navigate(item.path)} title={collapsed?item.label:""}
                style={{ display:"flex", alignItems:"center", gap:12, padding:collapsed?"10px 16px":"10px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", background:active?"rgba(99,132,255,0.12)":"transparent", color:active?"var(--accent)":"var(--text2)", fontFamily:"Syne", fontWeight:active?600:500, fontSize:14, transition:"all 0.15s", textAlign:"left", width:"100%", borderLeft:active?"3px solid var(--accent)":"3px solid transparent" }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--surface)";e.currentTarget.style.color="var(--text)";}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text2)";}}}
              >
                <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
                {!collapsed&&item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:"12px 8px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:4 }}>
          <button onClick={()=>setCollapsed(c=>!c)}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", background:"transparent", color:"var(--text2)", fontSize:14, width:"100%", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--surface)";e.currentTarget.style.color="var(--text)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--text2)";}}>
            <span style={{fontSize:18}}>{collapsed?"→":"←"}</span>
            {!collapsed&&"Collapse"}
          </button>
          {!collapsed&&<div style={{padding:"12px 14px",borderRadius:"var(--radius-sm)",background:"var(--surface)"}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{name}</div></div>}
          <button onClick={logout}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", background:"transparent", color:"var(--danger)", fontSize:14, width:"100%", transition:"all 0.15s", fontFamily:"Syne", fontWeight:600 }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,113,113,0.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:18}}>⊗</span>
            {!collapsed&&"Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:"auto", minHeight:"100vh" }}>
        {/* Top bar */}
        <div style={{ padding:"16px 32px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)" }}>
          <div style={{ fontSize:13, color:"var(--text2)" }}>
            {location.pathname.replace("/dashboard","Dashboard").replace("/",  " / ").replace(/-/g," ")}
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <ThemePicker />
            <button onClick={()=>setChatOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-sm)", color:"white", cursor:"pointer", fontFamily:"Syne", fontWeight:600, fontSize:13 }}>
              💬 Help
            </button>
          </div>
        </div>
        <div style={{ padding:"32px" }}>{children}</div>
      </main>

      {chatOpen&&<Chatbot onClose={()=>setChatOpen(false)}/>}
    </div>
  );
}
