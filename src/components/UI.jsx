import { useState } from "react";

const btnStyles = {
  primary:   { background:"linear-gradient(135deg,#6384ff 0%,#7b5ea7 100%)", color:"#fff", border:"1px solid rgba(99,132,255,0.4)", boxShadow:"0 4px 20px rgba(99,132,255,0.25)" },
  secondary: { background:"rgba(255,255,255,0.05)", color:"var(--text)", border:"1px solid var(--border2)" },
  ghost:     { background:"transparent", color:"var(--text2)", border:"1px solid transparent" },
  danger:    { background:"rgba(248,113,113,0.1)", color:"#f87171", border:"1px solid rgba(248,113,113,0.3)" },
  success:   { background:"rgba(52,211,153,0.1)", color:"#34d399", border:"1px solid rgba(52,211,153,0.3)" },
};
const btnSizes = {
  sm: { padding:"7px 16px", fontSize:12, borderRadius:8, lineHeight:1.2 },
  md: { padding:"11px 22px", fontSize:14, borderRadius:10, lineHeight:1.2 },
  lg: { padding:"14px 28px", fontSize:15, borderRadius:12, lineHeight:1.2 },
};

export function Btn({ children, onClick, variant="primary", size="md", loading, disabled, fullWidth, type="button", style:ex={} }) {
  const [hov, setHov] = useState(false);
  const hovOver = {
    primary:   { boxShadow:"0 8px 28px rgba(99,132,255,0.45)" },
    secondary: { background:"rgba(255,255,255,0.08)", borderColor:"var(--accent)" },
    ghost:     { background:"rgba(255,255,255,0.06)", color:"var(--text)" },
    danger:    { background:"rgba(248,113,113,0.18)" },
    success:   { background:"rgba(52,211,153,0.18)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"Syne,sans-serif", fontWeight:600, letterSpacing:"0.3px", cursor:disabled||loading?"not-allowed":"pointer", opacity:disabled||loading?0.5:1, width:fullWidth?"100%":"auto", transform:hov&&!disabled&&!loading?"translateY(-1px)":"none", transition:"all 0.2s ease", outline:"none", ...btnStyles[variant], ...btnSizes[size], ...(hov&&!disabled&&!loading?hovOver[variant]:{}), ...ex }}>
      {loading&&<span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"currentColor",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>}
      {children}
    </button>
  );
}

export function Input({ label, error, icon, style:ex={}, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, ...ex }}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:"var(--text2)",letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</label>}
      <div style={{position:"relative"}}>
        {icon&&<span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:foc?"var(--accent)":"var(--text3)",fontSize:15,pointerEvents:"none",transition:"color 0.2s"}}>{icon}</span>}
        <input {...props} onFocus={e=>{setFoc(true);props.onFocus?.(e)}} onBlur={e=>{setFoc(false);props.onBlur?.(e)}}
          style={{width:"100%",padding:icon?"12px 16px 12px 42px":"12px 16px",background:foc?"rgba(255,255,255,0.05)":"var(--surface)",border:`1px solid ${error?"var(--danger)":foc?"var(--accent)":"var(--border)"}`,borderRadius:10,color:"var(--text)",fontSize:14,outline:"none",transition:"all 0.2s",boxShadow:foc?"0 0 0 3px rgba(99,132,255,0.1)":"none",fontFamily:"DM Sans,sans-serif"}}/>
      </div>
      {error&&<span style={{fontSize:12,color:"var(--danger)"}}>⚠ {error}</span>}
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:"var(--text2)",letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</label>}
      <textarea {...props} rows={props.rows||3} onFocus={e=>{setFoc(true);props.onFocus?.(e)}} onBlur={e=>{setFoc(false);props.onBlur?.(e)}}
        style={{width:"100%",padding:"12px 16px",background:foc?"rgba(255,255,255,0.05)":"var(--surface)",border:`1px solid ${error?"var(--danger)":foc?"var(--accent)":"var(--border)"}`,borderRadius:10,color:"var(--text)",fontSize:14,outline:"none",resize:"vertical",transition:"all 0.2s",fontFamily:"DM Sans,sans-serif",boxShadow:foc?"0 0 0 3px rgba(99,132,255,0.1)":"none",lineHeight:1.6}}/>
      {error&&<span style={{fontSize:12,color:"var(--danger)"}}>⚠ {error}</span>}
    </div>
  );
}

export function Select({ label, options=[], error, ...props }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label&&<label style={{fontSize:12,fontWeight:600,color:"var(--text2)",letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</label>}
      <select {...props} style={{width:"100%",padding:"12px 16px",background:"var(--surface)",border:`1px solid ${error?"var(--danger)":"var(--border)"}`,borderRadius:10,color:"var(--text)",fontSize:14,outline:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
        {options.map(o=><option key={o.value} value={o.value} style={{background:"var(--bg2)"}}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Card({ children, glow, onClick, style={} }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>onClick&&setHov(true)} onMouseLeave={()=>onClick&&setHov(false)}
      style={{background:"var(--surface)",border:`1px solid ${hov?"var(--border2)":"var(--border)"}`,borderRadius:"var(--radius)",padding:24,boxShadow:glow?"var(--glow)":hov?"0 12px 40px rgba(0,0,0,0.3)":"var(--shadow)",transition:"all 0.2s ease",cursor:onClick?"pointer":"default",transform:hov&&onClick?"translateY(-2px)":"translateY(0)",...style}}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon, color="var(--accent)", sub }) {
  return (
    <Card style={{display:"flex",alignItems:"flex-start",gap:16}}>
      <div style={{width:48,height:48,borderRadius:14,background:`${color}18`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontSize:28,fontWeight:800,fontFamily:"Syne",color:"var(--text)",lineHeight:1}}>{value}</div>
        <div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{label}</div>
        {sub&&<div style={{fontSize:11,color,marginTop:4,fontWeight:600}}>{sub}</div>}
      </div>
    </Card>
  );
}

export function Modal({ open, onClose, title, children, width=520 }) {
  if (!open) return null;
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border2)",borderRadius:20,width:"100%",maxWidth:width,maxHeight:"88vh",overflow:"auto",animation:"fadeUp 0.25s ease",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"20px 28px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontFamily:"Syne",fontSize:17,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid var(--border)",color:"var(--text2)",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"24px 28px"}}>{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon="📭", title, desc, action }) {
  return (
    <div style={{textAlign:"center",padding:"60px 24px"}}>
      <div style={{fontSize:52,marginBottom:16}}>{icon}</div>
      <div style={{fontFamily:"Syne",fontSize:18,fontWeight:700,marginBottom:8}}>{title}</div>
      {desc&&<div style={{color:"var(--text2)",fontSize:14,marginBottom:24,lineHeight:1.7}}>{desc}</div>}
      {action}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:"flex",gap:4,background:"var(--surface)",borderRadius:12,padding:4,border:"1px solid var(--border)"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)}
          style={{flex:1,padding:"9px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Syne",fontWeight:600,fontSize:13,background:active===t.id?"linear-gradient(135deg,#6384ff 0%,#7b5ea7 100%)":"transparent",color:active===t.id?"white":"var(--text2)",transition:"all 0.2s",boxShadow:active===t.id?"0 4px 14px rgba(99,132,255,0.35)":"none"}}>
          {t.icon&&<span style={{marginRight:6,fontSize:14}}>{t.icon}</span>}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, onChange, size=20 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} onClick={()=>onChange?.(i)} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(0)}
          style={{fontSize:size,cursor:onChange?"pointer":"default",color:i<=(hov||value)?"#fbbf24":"var(--border2)",transition:"all 0.15s",transform:hov===i?"scale(1.2)":"scale(1)",display:"inline-block"}}>★</span>
      ))}
    </div>
  );
}

export function Progress({ value, max=100, color="var(--accent)", label }) {
  const pct = Math.min((value/max)*100,100);
  return (
    <div>
      {label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12,color:"var(--text2)"}}><span>{label}</span><span style={{fontWeight:600,color:"var(--text)"}}>{value}</span></div>}
      <div style={{height:6,background:"var(--surface2)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}bb)`,borderRadius:3,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}

export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24}}>
      <div>
        <h2 style={{fontFamily:"Syne",fontSize:22,fontWeight:800,letterSpacing:"-0.5px"}}>{title}</h2>
        {sub&&<p style={{color:"var(--text2)",fontSize:13,marginTop:4}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
