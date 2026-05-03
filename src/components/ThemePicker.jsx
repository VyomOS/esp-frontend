import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change color theme"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: "var(--surface)",
          border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)",
          cursor: "pointer", color: "var(--text2)", fontSize: 13,
          fontFamily: "Syne", fontWeight: 600, transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}
      >
        🎨 Theme
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--bg2)", border: "1px solid var(--border2)",
            borderRadius: "var(--radius)", padding: 16, zIndex: 1000,
            minWidth: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            animation: "fadeUp 0.2s ease", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, marginBottom: 12, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>
              Choose Theme
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "10px", borderRadius: "var(--radius-sm)",
                    border: `2px solid ${theme === t.id ? "var(--accent)" : "var(--border)"}`,
                    background: theme === t.id ? "rgba(99,132,255,0.08)" : "var(--surface)",
                    cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                  }}
                  onMouseEnter={e => { if (theme !== t.id) e.currentTarget.style.borderColor = "var(--border2)"; }}
                  onMouseLeave={e => { if (theme !== t.id) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    {t.preview.map((color, i) => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: color, border: "2px solid rgba(128,128,128,0.2)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "Syne", color: theme === t.id ? "var(--accent)" : "var(--text2)" }}>
                    {t.label}{theme === t.id ? " ✓" : ""}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--surface)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text3)" }}>
              Theme is saved automatically in your browser.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
