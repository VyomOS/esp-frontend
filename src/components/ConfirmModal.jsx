import { Btn } from "./UI";

export default function ConfirmModal({ open, onClose, onConfirm, title, message, variant="danger", confirmLabel }) {
  if(!open) return null;

  const colors = {
    danger:  { icon:"⚠", iconBg:"var(--red-bg,#FAEBE8)", iconColor:"var(--red,#B84232)" },
    success: { icon:"✓", iconBg:"var(--teal-bg,#E4F2EB)",  iconColor:"var(--teal,#18664A)" },
    warning: { icon:"!", iconBg:"var(--amber-bg,#FDF3E4)", iconColor:"var(--amber,#B8720A)" },
  };
  const c = colors[variant] || colors.danger;
  const label = confirmLabel || (variant==="success" ? "Confirm" : variant==="warning" ? "Proceed" : "Delete");

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{
        position:"fixed", inset:0, background:"rgba(11,29,51,0.5)",
        backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
        justifyContent:"center", zIndex:1100, padding:20,
        animation:"fadeIn 0.18s ease",
      }}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:"var(--radius-lg)", width:"100%", maxWidth:420,
        padding:"32px 28px", boxShadow:"0 24px 80px rgba(11,29,51,0.2)",
        animation:"fadeUp 0.2s ease", textAlign:"center",
      }}>
        <div style={{
          width:52, height:52, borderRadius:"50%",
          background:c.iconBg, color:c.iconColor,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:700, margin:"0 auto 18px",
          border:`1.5px solid ${c.iconColor}25`,
        }}>{c.icon}</div>

        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:"var(--text)", marginBottom:10, letterSpacing:"-0.01em" }}>{title}</h3>
        <p style={{ fontSize:14, color:"var(--text3)", lineHeight:1.65, marginBottom:24 }}>{message}</p>

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <Btn onClick={onClose} variant="secondary" size="md" style={{ minWidth:100 }}>Cancel</Btn>
          <Btn onClick={async()=>{ await onConfirm(); onClose(); }} variant={variant==="success"?"success":"danger"} size="md" style={{ minWidth:100 }}>{label}</Btn>
        </div>
      </div>
    </div>
  );
}
