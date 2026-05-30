import { useState } from "react";

/* ── Button ───────────────────────────────────────────────── */
export function Btn({ children, onClick, variant="primary", size="md", fullWidth, loading, disabled, style={}, type="button" }) {
  const sizes = {
    sm: { fontSize:12, padding:"7px 16px",  borderRadius:"var(--radius-sm)" },
    md: { fontSize:13, padding:"10px 20px", borderRadius:"var(--radius-sm)" },
    lg: { fontSize:14, padding:"13px 28px", borderRadius:"var(--radius-sm)" },
  };
  const variants = {
    primary:   { bg:"var(--navy,var(--accent))",  fg:"var(--cream,white)",  border:"none",                    hoverBg:"var(--teal,var(--accent2))" },
    success:   { bg:"var(--teal,var(--accent))",  fg:"white",               border:"none",                    hoverBg:"var(--teal-2,var(--accent3))" },
    danger:    { bg:"var(--red,var(--danger))",   fg:"white",               border:"none",                    hoverBg:"var(--red,var(--danger))" },
    secondary: { bg:"var(--surface)",             fg:"var(--text2)",        border:"1.5px solid var(--border)", hoverBg:"var(--bg3)" },
    ghost:     { bg:"transparent",                fg:"var(--text3)",        border:"1.5px solid var(--border)", hoverBg:"var(--bg3)" },
    outline:   { bg:"transparent",                fg:"var(--teal,var(--accent))", border:"1.5px solid var(--teal,var(--accent))", hoverBg:"var(--teal-bg,rgba(24,102,74,0.08))" },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, letterSpacing:"0.01em",
        cursor: loading||disabled ? "not-allowed" : "pointer",
        border: v.border || "none",
        background: v.bg, color: v.fg,
        transition:"all 0.18s", outline:"none",
        opacity: disabled||loading ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
        ...s, ...style,
      }}
      onMouseEnter={e=>{ if(!disabled&&!loading){ e.currentTarget.style.background=v.hoverBg; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; } }}
      onMouseLeave={e=>{ e.currentTarget.style.background=v.bg; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
      {loading ? <><span className="spinner" style={{width:13,height:13}}/>{children}</> : children}
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────── */
export function Card({ children, style={}, onClick, glow, accent }) {
  const base = {
    background:"var(--surface)",
    border: accent ? `1.5px solid var(--teal,var(--accent))` : "1px solid var(--border)",
    borderRadius:"var(--radius)",
    padding:"24px 28px",
    boxShadow: glow ? "var(--shadow), var(--glow)" : "var(--shadow-sm)",
    transition:"all 0.2s",
    cursor: onClick ? "pointer" : undefined,
    ...style,
  };
  return (
    <div style={base}
      onMouseEnter={onClick ? e=>{ e.currentTarget.style.boxShadow="var(--shadow)"; e.currentTarget.style.transform="translateY(-2px)"; } : undefined}
      onMouseLeave={onClick ? e=>{ e.currentTarget.style.boxShadow=base.boxShadow; e.currentTarget.style.transform=""; } : undefined}
      onClick={onClick}>
      {children}
    </div>
  );
}

/* ── Input ────────────────────────────────────────────────── */
export function Input({ label, error, icon, style={}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, ...style }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none", color:"var(--text3)" }}>{icon}</span>}
        <input {...props}
          onFocus={e=>{ setFocused(true); props.onFocus?.(e); }}
          onBlur={e=>{ setFocused(false); props.onBlur?.(e); }}
          style={{
            width:"100%", padding: icon ? "10px 14px 10px 36px" : "10px 14px",
            background:"var(--bg)", color:"var(--text)", fontSize:14,
            border:`1.5px solid ${focused ? "var(--teal,var(--accent))" : error ? "var(--red,var(--danger))" : "var(--border)"}`,
            borderRadius:"var(--radius-sm)", outline:"none",
            transition:"border-color 0.18s", fontFamily:"'DM Sans',sans-serif",
          }}/>
      </div>
      {error && <span style={{ fontSize:11, color:"var(--red,var(--danger))" }}>{error}</span>}
    </div>
  );
}

/* ── Textarea ─────────────────────────────────────────────── */
export function Textarea({ label, rows=4, error, style={}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, ...style }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</label>}
      <textarea rows={rows} {...props}
        onFocus={e=>{ setFocused(true); props.onFocus?.(e); }}
        onBlur={e=>{ setFocused(false); props.onBlur?.(e); }}
        style={{
          width:"100%", padding:"10px 14px", resize:"vertical",
          background:"var(--bg)", color:"var(--text)", fontSize:14,
          border:`1.5px solid ${focused ? "var(--teal,var(--accent))" : error ? "var(--red,var(--danger))" : "var(--border)"}`,
          borderRadius:"var(--radius-sm)", outline:"none",
          transition:"border-color 0.18s", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6,
        }}/>
      {error && <span style={{ fontSize:11, color:"var(--red,var(--danger))" }}>{error}</span>}
    </div>
  );
}

/* ── Select ───────────────────────────────────────────────── */
export function Select({ label, options=[], error, style={}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, ...style }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</label>}
      <select {...props}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        style={{
          width:"100%", padding:"10px 32px 10px 14px", appearance:"none", cursor:"pointer",
          background:`var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2367788D' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center`,
          color:"var(--text)", fontSize:14, fontFamily:"'DM Sans',sans-serif",
          border:`1.5px solid ${focused ? "var(--teal,var(--accent))" : error ? "var(--red,var(--danger))" : "var(--border)"}`,
          borderRadius:"var(--radius-sm)", outline:"none", transition:"border-color 0.18s",
        }}>
        {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
      {error && <span style={{ fontSize:11, color:"var(--red,var(--danger))" }}>{error}</span>}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width=480 }) {
  if(!open) return null;
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{
        position:"fixed", inset:0, background:"rgba(11,29,51,0.55)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", zIndex:1000, padding:20, animation:"fadeIn 0.2s ease",
      }}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:"var(--radius-lg)", width:"100%", maxWidth:width,
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 24px 80px rgba(11,29,51,0.2)",
        animation:"fadeUp 0.22s ease",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 24px", borderBottom:"1px solid var(--border)",
        }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--text)", letterSpacing:"-0.02em" }}>{title}</h3>
          <button onClick={onClose} style={{
            background:"none", border:"none", cursor:"pointer", color:"var(--text3)",
            width:28, height:28, borderRadius:6, display:"flex", alignItems:"center",
            justifyContent:"center", transition:"all 0.15s", fontSize:18, lineHeight:1,
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="var(--bg3)"; e.currentTarget.style.color="var(--text)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--text3)"; }}>
            ×
          </button>
        </div>
        <div style={{ padding:"22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display:"flex", gap:0, flexWrap:"wrap",
      borderBottom:"1.5px solid var(--border)",
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"10px 18px", background:"none", border:"none",
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:13, letterSpacing:"0.01em",
              color: isActive ? "var(--navy,var(--text))" : "var(--text3)",
              borderBottom: isActive ? "2px solid var(--teal,var(--accent))" : "2px solid transparent",
              marginBottom:"-1.5px", transition:"all 0.16s",
            }}
            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.color="var(--text2)"; }}
            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.color="var(--text3)"; }}>
            {t.icon && <span style={{ fontSize:14 }}>{t.icon}</span>}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── SectionHeader ────────────────────────────────────────── */
export function SectionHeader({ title, sub, action, eyebrow }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:22 }}>
      <div>
        {eyebrow && <div className="eyebrow eyebrow-teal">{eyebrow}</div>}
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"var(--text)", letterSpacing:"-0.02em", lineHeight:1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:"var(--text3)", marginTop:5, lineHeight:1.5 }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink:0, marginTop:4 }}>{action}</div>}
    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:"var(--radius)", padding:"20px 24px",
      boxShadow:"var(--shadow-sm)",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</span>
        {icon && <span style={{ fontSize:20, opacity:0.65 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:color||"var(--text)", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"var(--text3)", marginTop:6, lineHeight:1.4 }}>{sub}</div>}
    </div>
  );
}

/* ── Empty ────────────────────────────────────────────────── */
export function Empty({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign:"center", padding:"56px 24px" }}>
      {icon && <div style={{ fontSize:40, marginBottom:16, opacity:0.35 }}>{icon}</div>}
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:600, color:"var(--text2)", marginBottom:8 }}>{title}</div>
      {desc && <p style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6, maxWidth:300, margin:"0 auto" }}>{desc}</p>}
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  );
}

/* ── Progress ─────────────────────────────────────────────── */
export function Progress({ value, max=100, color }) {
  return (
    <div style={{ background:"var(--bg3)", borderRadius:99, height:6, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${(value/max)*100}%`, background:color||"var(--teal,var(--accent))", borderRadius:99, transition:"width 0.9s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
  );
}

/* ── Stars ────────────────────────────────────────────────── */
export function Stars({ rating, size=14 }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{ fontSize:size, color:i<=Math.round(rating)?"var(--amber,var(--warn))":"var(--border)" }}>★</span>
      ))}
    </div>
  );
}

/* ── InfoRow ──────────────────────────────────────────────── */
export function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.07em", display:"flex", alignItems:"center", gap:6 }}>
        {icon && <span>{icon}</span>}{label}
      </span>
      <span style={{ fontSize:14, fontWeight:500, color:"var(--text2)" }}>{value||"—"}</span>
    </div>
  );
}
