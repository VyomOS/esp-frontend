import { useState } from "react";

// ── Button ────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md", loading, disabled, fullWidth, type = "button" }) {
  const [hovered, setHovered] = useState(false);

  const styles = {
    primary:   { background: "linear-gradient(135deg, #6384ff, #7b5ea7)", color: "#fff", border: "1px solid rgba(99,132,255,0.4)", boxShadow: hovered ? "0 8px 28px rgba(99,132,255,0.45)" : "0 4px 20px rgba(99,132,255,0.25)" },
    secondary: { background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", color: "var(--text)", border: `1px solid ${hovered ? "var(--accent)" : "var(--border2)"}` },
    ghost:     { background: hovered ? "rgba(255,255,255,0.06)" : "transparent", color: hovered ? "var(--text)" : "var(--text2)", border: "1px solid transparent" },
    danger:    { background: hovered ? "rgba(248,113,113,0.18)" : "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" },
    success:   { background: hovered ? "rgba(52,211,153,0.18)" : "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" },
  };

  const sizes = {
    sm: { padding: "7px 16px",  fontSize: 12, borderRadius: 8 },
    md: { padding: "11px 22px", fontSize: 14, borderRadius: 10 },
    lg: { padding: "14px 28px", fontSize: 15, borderRadius: 12 },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: "0.3px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        transform: hovered && !disabled && !loading ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
        outline: "none",
        ...styles[variant],
        ...sizes[size],
      }}
    >
      {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────
export function Input({ label, error, icon, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          style={{
            width: "100%", padding: icon ? "12px 16px 12px 44px" : "12px 16px",
            background: "var(--surface)", border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
          onBlur={e  => { e.target.style.borderColor = error ? "var(--danger)" : "var(--border)"; }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────
export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)" }}>{label}</label>}
      <textarea
        {...props}
        rows={props.rows || 3}
        style={{
          width: "100%", padding: "12px 16px",
          background: "var(--surface)", border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none",
          resize: "vertical", transition: "border-color 0.2s", fontFamily: "inherit",
        }}
        onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={e  => { e.target.style.borderColor = error ? "var(--danger)" : "var(--border)"; }}
      />
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────
export function Select({ label, options = [], error, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)" }}>{label}</label>}
      <select
        {...props}
        style={{
          width: "100%", padding: "12px 16px",
          background: "var(--surface)", border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "var(--bg2)" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, className = "", glow, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "24px",
        boxShadow: glow ? "var(--glow)" : "var(--shadow)",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      className={className}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = "var(--border2)"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      {children}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
export function StatCard({ label, value, icon, color = "var(--accent)", sub }) {
  return (
    <Card style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "Syne", color: "var(--text)" }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 4 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: width, maxHeight: "85vh", overflow: "auto", animation: "fadeUp 0.2s ease" }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
export function Empty({ icon = "📭", title, desc, action }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {desc && <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24 }}>{desc}</div>}
      {action}
    </div>
  );
}

// ── Tab Bar ───────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: 4 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer",
            fontFamily: "Syne", fontWeight: 600, fontSize: 13,
            background: active === t.id ? "var(--accent)" : "transparent",
            color: active === t.id ? "white" : "var(--text2)",
            transition: "all 0.2s",
          }}
        >
          {t.icon && <span style={{ marginRight: 6 }}>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Rating Stars ──────────────────────────────────────────
export function Stars({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize: size, cursor: onChange ? "pointer" : "default", color: i <= (hover || value) ? "var(--warn)" : "var(--border2)", transition: "color 0.15s" }}
        >★</span>
      ))}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────
export function Progress({ value, max = 100, color = "var(--accent)", label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "var(--text2)" }}>
        <span>{label}</span><span>{value}</span>
      </div>}
      <div style={{ height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h2 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 700 }}>{title}</h2>
        {sub && <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
