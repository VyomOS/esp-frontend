import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{
          display:"flex", alignItems:"center", gap:7,
          padding:"7px 12px", background:"var(--surface)",
          border:"1.5px solid var(--border)", borderRadius:"var(--radius-sm)",
          cursor:"pointer", color:"var(--text3)", fontSize:12,
          fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          transition:"all 0.15s", letterSpacing:"0.02em",
        }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--teal,var(--accent))"; e.currentTarget.style.color="var(--text)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text3)"; }}>
        {/* Color swatches of current theme */}
        <div style={{ display:"flex", gap:3, alignItems:"center" }}>
          {current.preview.map((c,i)=>(
            <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, border:"1px solid rgba(0,0,0,0.1)" }}/>
          ))}
        </div>
        <span style={{ fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase" }}>Theme</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, zIndex:999 }}/>
          <div style={{
            position:"absolute", top:"calc(100% + 8px)", right:0,
            background:"var(--surface)", border:"1px solid var(--border)",
            borderRadius:"var(--radius)", padding:16, zIndex:1000,
            minWidth:300, boxShadow:"0 16px 56px rgba(11,29,51,0.18)",
            animation:"fadeUp 0.18s ease",
          }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--text3)", marginBottom:12 }}>Choose theme</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {THEMES.map(t=>{
                const isActive = theme === t.id;
                return (
                  <button key={t.id} onClick={()=>{ setTheme(t.id); setOpen(false); }}
                    style={{
                      display:"flex", flexDirection:"column", gap:7,
                      padding:"10px 10px", borderRadius:"var(--radius-sm)",
                      border:`1.5px solid ${isActive?"var(--teal,var(--accent))":"var(--border)"}`,
                      background: isActive ? "var(--teal-bg,rgba(24,102,74,0.08))" : "var(--bg)",
                      cursor:"pointer", transition:"all 0.14s", textAlign:"left",
                    }}
                    onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.borderColor="var(--text3)"; e.currentTarget.style.background="var(--bg3)"; } }}
                    onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg)"; } }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {t.preview.map((c,i)=>(
                        <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:c, border:"1.5px solid rgba(0,0,0,0.08)" }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:11, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--teal,var(--accent))" : "var(--text3)", letterSpacing:"0.02em" }}>
                      {t.label}{isActive ? " ✓" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:10, padding:"7px 10px", background:"var(--bg3)", borderRadius:"var(--radius-sm)", fontSize:11, color:"var(--text3)", lineHeight:1.5 }}>
              Theme preference is saved in your browser.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
