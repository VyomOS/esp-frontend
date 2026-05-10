import { useNavigate } from "react-router-dom";
import ThemePicker from "../components/ThemePicker";

const STATS = [
  { value: "10,000+", label: "Women Deployed",    icon: "👩" },
  { value: "18",      label: "Cities Covered",    icon: "🏙" },
  { value: "500+",    label: "MSME Vendors",      icon: "🏭" },
  { value: "100%",    label: "ESG Verified",      icon: "✅" },
];

const FEATURES = [
  { icon: "🔍", title: "Verified Vendor Registry", desc: "Every vendor is KYC-verified, ESG-scored, and certified before appearing on the platform. Zero unverified listings." },
  { icon: "🤖", title: "AI Vendor Matching",       desc: "Post a procurement request and let AI surface the top 3 most suitable vendors based on your requirements and impact criteria." },
  { icon: "🌱", title: "ESG Transparency",         desc: "Comprehensive 25-field ESG scoring across Environmental, Social, and Governance pillars. Every vendor gets a 0–100 score." },
  { icon: "📋", title: "Smart Onboarding",         desc: "Vendors onboard in minutes. Auto-fill from GST, MCA, and Udyam registries. Upload a catalogue — AI extracts your services." },
  { icon: "🏆", title: "Bid Management",           desc: "Buyers post RFPs with ESG criteria. Vendors submit proposals. Compare bids side-by-side. Award and track impact." },
  { icon: "📊", title: "SDG Alignment",            desc: "Every procurement transaction is mapped to UN Sustainable Development Goals. Build your impact report automatically." },
];

const CATEGORIES = [
  { icon: "🚚", name: "Logistics & Delivery" },
  { icon: "🧹", name: "Facilities & Cleaning" },
  { icon: "👥", name: "Staffing & Training" },
  { icon: "🍱", name: "Food & Catering" },
  { icon: "🧵", name: "Textiles & Apparel" },
  { icon: "💻", name: "IT & Digital Services" },
  { icon: "☀️", name: "Green & Sustainability" },
  { icon: "🎨", name: "Handicrafts & Artisan" },
  { icon: "🏥", name: "Healthcare & Wellness" },
  { icon: "🏗️", name: "Construction & Fitout" },
];

const ESG_BANDS = [
  { band: "ESG Leader",       range: "80–100", color: "#34d399", desc: "Strong across all three pillars" },
  { band: "ESG Progressing",  range: "60–79",  color: "#fbbf24", desc: "Good on 1–2 pillars, developing others" },
  { band: "ESG Developing",   range: "40–59",  color: "#f97316", desc: "Partial compliance with gaps flagged" },
  { band: "ESG Baseline",     range: "0–39",   color: "#f87171", desc: "Early stage with improvement roadmap" },
];

export default function Landing() {
  const navigate = useNavigate();

  const hdr = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,107,53,0.1)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 48px", height: 64,
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", color: "#1a1a2e", background: "#ffffff" }}>
      {/* Header */}
      <header style={hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#ff6b35", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: "white" }}>E</div>
          <div>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: "#1a1a2e" }}>Even Procurement</div>
            <div style={{ fontSize: 10, color: "#a0aec0", letterSpacing: 1, textTransform: "uppercase" }}>ESG Sourcing Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ThemePicker />
          <button onClick={()=>navigate("/register")} style={{ padding: "9px 20px", background: "transparent", border: "1px solid #ff6b35", borderRadius: 8, color: "#ff6b35", cursor: "pointer", fontFamily: "Syne", fontWeight: 600, fontSize: 13 }}>Register</button>
          <button onClick={()=>navigate("/")} style={{ padding: "9px 20px", background: "#ff6b35", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "Syne", fontWeight: 600, fontSize: 13 }}>Sign In</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: "center", background: "linear-gradient(135deg, #fff7f4 0%, #ffffff 50%, #f0fdf4 100%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(255,107,53,0.1)", borderRadius: 20, fontSize: 13, color: "#ff6b35", fontWeight: 600, marginBottom: 24 }}>
          🇮🇳 India's First ESG-First Procurement Platform
        </div>
        <h1 style={{ fontFamily: "Syne", fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: "#1a1a2e", maxWidth: 700, margin: "0 auto 24px" }}>
          Source with<br/>
          <span style={{ color: "#ff6b35" }}>Purpose</span>. Measure<br/>
          <span style={{ color: "#2ecc71" }}>Impact</span>.
        </h1>
        <p style={{ fontSize: 18, color: "#4a5568", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Connect with verified women-led businesses, MSMEs, SHGs, and social enterprises. Every vendor ESG-scored. Every purchase SDG-aligned.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={()=>navigate("/register")} style={{ padding: "16px 36px", background: "#ff6b35", border: "none", borderRadius: 12, color: "white", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 28px rgba(255,107,53,0.35)" }}>
            Start as Vendor →
          </button>
          <button onClick={()=>navigate("/register")} style={{ padding: "16px 36px", background: "transparent", border: "2px solid #2ecc71", borderRadius: 12, color: "#1a1a2e", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>
            Source as Buyer →
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "48px 48px", background: "#ff6b35" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 32, color: "white" }}>{s.value}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", background: "#f7f9fc" }}>
        <h2 style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>Everything you need for impact procurement</h2>
        <p style={{ textAlign: "center", color: "#4a5568", marginBottom: 56, fontSize: 16 }}>Built from the ground up for ESG-first sourcing</p>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid rgba(255,107,53,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{f.title}</div>
              <div style={{ color: "#4a5568", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "80px 48px", background: "white" }}>
        <h2 style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>10 procurement categories</h2>
        <p style={{ textAlign: "center", color: "#4a5568", marginBottom: 48, fontSize: 16 }}>Controlled taxonomy shared across vendors and buyers for precise matching</p>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {CATEGORIES.map(c => (
            <div key={c.name} style={{ textAlign: "center", padding: "24px 16px", background: "#f7f9fc", borderRadius: 12, border: "1px solid rgba(255,107,53,0.1)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontFamily: "Syne", fontWeight: 600, fontSize: 13, color: "#1a1a2e", lineHeight: 1.3 }}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ESG Scoring */}
      <section style={{ padding: "80px 48px", background: "#f7f9fc" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", padding: "4px 14px", background: "rgba(52,211,153,0.1)", borderRadius: 20, fontSize: 13, color: "#27ae60", fontWeight: 600, marginBottom: 16 }}>ESG Scoring Framework</div>
            <h2 style={{ fontFamily: "Syne", fontSize: 34, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>India's most rigorous vendor ESG scorecard</h2>
            <p style={{ color: "#4a5568", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>25-field assessment across Environmental (30%), Social (45%), and Governance (25%) pillars. Every score is auditable, explainable, and updated in real time.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["🌿 Environmental (30%)", "Carbon, renewables, packaging, waste"],["👩 Social (45%)", "Women employment, jobs, wages, training"],["🏛 Governance (25%)", "Ownership, compliance, transparency"]].map(([t,d])=>(
                <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 600, fontSize: 14, minWidth: 180 }}>{t}</div>
                  <div style={{ color: "#4a5568", fontSize: 13 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ESG_BANDS.map(b => (
              <div key={b.band} style={{ padding: "16px 20px", background: "white", borderRadius: 12, border: `2px solid ${b.color}30`, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: `${b.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 14, color: b.color }}>{b.range}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, color: b.color }}>{b.band}</div>
                  <div style={{ fontSize: 13, color: "#4a5568" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 48px", background: "#1a1a2e", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, color: "white", marginBottom: 16 }}>Ready to source with purpose?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 40 }}>Join India's first ESG-first procurement platform. Free to get started.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={()=>navigate("/register")} style={{ padding: "16px 40px", background: "#ff6b35", border: "none", borderRadius: 12, color: "white", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 28px rgba(255,107,53,0.4)" }}>
            Register Now — It's Free
          </button>
          <button onClick={()=>navigate("/")} style={{ padding: "16px 40px", background: "transparent", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "white", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>
            Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", background: "#0a0a14", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#ff6b35", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 12, color: "white" }}>E</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, color: "white", fontSize: 14 }}>Even Procurement</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>© 2026 Even Livelihoods Private Limited · contact@evencargo.in</div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          <span style={{ cursor: "pointer" }}>Privacy Policy</span>
          <span style={{ cursor: "pointer" }}>Terms of Service</span>
          <span style={{ cursor: "pointer" }}>Contact</span>
        </div>
      </footer>
    </div>
  );
}
