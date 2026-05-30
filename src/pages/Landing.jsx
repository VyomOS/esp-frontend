import { useNavigate } from "react-router-dom";
import ThemePicker from "../components/ThemePicker";

const STATS = [
  { value:"10,000+", label:"Women deployed" },
  { value:"18",      label:"Cities covered" },
  { value:"500+",    label:"Verified vendors" },
  { value:"25",      label:"ESG data points" },
];

const PROBLEMS = [
  { n:"01", title:"Vendor concentration", body:"Your top five vendors in any critical category likely account for 70–80% of spend. Concentration is not efficiency — it is deferred risk." },
  { n:"02", title:"No verified vendor data", body:"You have contracts and codes of conduct. What you don't have is verified data on whether vendors are meeting them. Self-declarations are not data." },
  { n:"03", title:"BRSR readiness gap", body:"Top 250 Indian companies must report ESG data on significant supply chain partners. The mandatory assessment deadline is FY 2026–27. Most haven't started." },
  { n:"04", title:"International market access", body:"International buyers and FDI investors screen supply chains. If you can't provide vendor ESG data, you lose contracts." },
  { n:"05", title:"Scope 3 blind spot", body:"Most companies have Scope 1 and 2 visibility. Almost none have structured Scope 3 data from their vendor base. BRSR Principle 6 now requires it." },
  { n:"06", title:"Informal sector excluded", body:"India's most impactful vendors — SHGs, cooperatives, women artisans — are invisible to formal procurement. ESP changes that." },
];

const FEATURES = [
  { icon:"🔍", title:"Verified vendor registry",    desc:"Every vendor is KYC-verified, ESG-scored, and certified before appearing. Zero unverified listings." },
  { icon:"🌱", title:"25-field ESG scoring",        desc:"Environmental, Social, and Governance pillars produce a 0–100 weighted score per vendor. Auditable and explainable." },
  { icon:"🤖", title:"AI vendor matching",          desc:"Post an RFP and AI surfaces the best vendors based on your ESG criteria, certifications, and impact requirements." },
  { icon:"📋", title:"Bid management",              desc:"Vendors submit structured proposals. Buyers compare side-by-side, shortlist, and award. Full audit trail." },
  { icon:"📊", title:"SDG alignment",               desc:"Every procurement transaction is mapped to UN SDGs. Build your impact report automatically." },
  { icon:"🏛",  title:"Registry auto-fill",         desc:"Vendor profiles auto-fill from MCA21, GST, and Udyam registries. Data grounded in public records, not self-declaration." },
];

const CATEGORIES = [
  { icon:"🚚", name:"Logistics & Delivery" },
  { icon:"🧹", name:"Facilities & Cleaning" },
  { icon:"👥", name:"Staffing & Training" },
  { icon:"🍱", name:"Food & Catering" },
  { icon:"🧵", name:"Textiles & Apparel" },
  { icon:"💻", name:"IT & Digital Services" },
  { icon:"☀️", name:"Green & Sustainability" },
  { icon:"🎨", name:"Handicrafts & Artisan" },
  { icon:"🏥", name:"Healthcare & Wellness" },
  { icon:"🏗️", name:"Construction & Fitout" },
];

const ESG_BANDS = [
  { range:"80–100", band:"ESG Leader",      color:"#18664A", bg:"#E4F2EB", desc:"Strong across all three pillars. Recommended for ESG-committed buyers." },
  { range:"60–79",  band:"ESG Progressing", color:"#B8720A", bg:"#FDF3E4", desc:"Good on 1–2 pillars. Eligible for most buyer requirements." },
  { range:"40–59",  band:"ESG Developing",  color:"#7a5a00", bg:"#FDF8E4", desc:"Partial compliance. Platform flags specific gaps with action items." },
  { range:"0–39",   band:"ESG Baseline",    color:"#B84232", bg:"#FAEBE8", desc:"Early stage. Platform provides a personalised improvement roadmap." },
];

const URGENCY = [
  { dot:"#B84232", label:"BRSR FY 2025–26",   body:"Top 250 companies: voluntary value chain ESG disclosure. The year to build the system." },
  { dot:"#B8720A", label:"BRSR FY 2026–27",   body:"Third-party assessment mandatory. Companies without vendor ESG data will be non-compliant." },
  { dot:"#B8720A", label:"CSRD — in scope",   body:"Indian subsidiaries and exporters to EU companies must provide supply chain ESG data." },
  { dot:"#18664A", label:"Investor screens",  body:"Institutional FDI increasingly requires supply chain equity data before deployment." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#F2EBD9", color:"#253446", overflowX:"hidden" }}>

      {/* ── Nav ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        background:"rgba(242,235,217,0.93)", backdropFilter:"blur(14px)",
        borderBottom:"1px solid #D4C9B5", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 6%",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:6, background:"#18664A", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L12 4.5V8.5L6.5 12L1 8.5V4.5L6.5 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#0B1D33" }}>Even Procurement</span>
        </div>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          <a href="#problems" style={{ fontSize:13, fontWeight:500, color:"#67788D", textDecoration:"none" }}>The Problem</a>
          <a href="#features" style={{ fontSize:13, fontWeight:500, color:"#67788D", textDecoration:"none" }}>Platform</a>
          <a href="#esg"      style={{ fontSize:13, fontWeight:500, color:"#67788D", textDecoration:"none" }}>ESG Score</a>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <ThemePicker/>
          <button onClick={()=>navigate("/")}
            style={{ padding:"8px 18px", background:"transparent", border:"1.5px solid #D4C9B5", borderRadius:6, color:"#0B1D33", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#18664A"; e.currentTarget.style.color="#18664A"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#D4C9B5"; e.currentTarget.style.color="#0B1D33"; }}>
            Sign in
          </button>
          <button onClick={()=>navigate("/register")}
            style={{ padding:"8px 18px", background:"#0B1D33", border:"none", borderRadius:6, color:"#F2EBD9", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#18664A"}
            onMouseLeave={e=>e.currentTarget.style.background="#0B1D33"}>
            Get started →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight:"100vh", padding:"120px 6% 80px", display:"flex", alignItems:"center", position:"relative", overflow:"hidden" }}>
        {/* Decorative circle */}
        <div style={{ position:"absolute", right:"-15%", top:"-20%", width:"65vw", height:"65vw", borderRadius:"50%", border:"1.5px solid rgba(11,29,51,0.06)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", right:"-5%", top:"10%", width:"40vw", height:"40vw", borderRadius:"50%", border:"1px solid rgba(11,29,51,0.04)", pointerEvents:"none" }}/>

        <div style={{ maxWidth:1160, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
          <div>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#E4F2EB", color:"#18664A",
              fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
              padding:"5px 12px 5px 5px", borderRadius:99, marginBottom:28,
            }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"#18664A", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1L8 3V6L4.5 8L1 6V3L4.5 1Z" fill="white"/></svg>
              </div>
              Procurement Resilience Platform
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,4.5vw,56px)", fontWeight:700, lineHeight:1.1, color:"#0B1D33", letterSpacing:"-0.025em", marginBottom:20 }}>
              Source with<br/>
              <em style={{ fontStyle:"italic", color:"#18664A" }}>purpose</em>.<br/>
              Measure impact.
            </h1>
            <p style={{ fontSize:16, color:"#67788D", lineHeight:1.75, marginBottom:36, maxWidth:480 }}>
              India's first ESG-first procurement marketplace. Verified women-led businesses, MSMEs, SHGs, and social enterprises — every vendor scored, every purchase SDG-aligned.
            </p>
            <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap", marginBottom:40 }}>
              <button onClick={()=>navigate("/register")}
                style={{ padding:"14px 28px", background:"#0B1D33", border:"none", borderRadius:6, color:"#F2EBD9", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, display:"flex", alignItems:"center", gap:8, transition:"all 0.2s", boxShadow:"0 6px 28px rgba(11,29,51,0.2)" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#18664A"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#0B1D33"; e.currentTarget.style.transform=""; }}>
                Start as a vendor
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={()=>navigate("/register")}
                style={{ padding:"14px 28px", background:"transparent", border:"1.5px solid #D4C9B5", borderRadius:6, color:"#0B1D33", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, transition:"all 0.2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#18664A"; e.currentTarget.style.color="#18664A"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#D4C9B5"; e.currentTarget.style.color="#0B1D33"; }}>
                Source as a buyer
              </button>
            </div>
            <div style={{ fontSize:12, color:"#67788D", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#18664A" }}/>
              KYC-verified vendors · ESG-scored · SDG-aligned · Free to get started
            </div>
          </div>

          {/* Right visual */}
          <div style={{ position:"relative" }}>
            {/* Main card */}
            <div style={{ background:"#0B1D33", borderRadius:16, padding:"28px", boxShadow:"0 24px 64px rgba(11,29,51,0.25)", position:"relative", zIndex:2 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(242,235,217,0.45)", marginBottom:16 }}>BRSR Regulatory Timeline</div>
              {URGENCY.map((u,i)=>(
                <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 0", borderBottom:i<URGENCY.length-1?"1px solid rgba(255,255,255,0.07)":undefined }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:u.dot, flexShrink:0, marginTop:4 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#F2EBD9", marginBottom:2 }}>{u.label}</div>
                    <div style={{ fontSize:12, color:"rgba(242,235,217,0.5)", lineHeight:1.5 }}>{u.body}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Floating stat */}
            <div style={{
              position:"absolute", left:"-12%", bottom:"10%", zIndex:3,
              background:"#fff", borderRadius:12, padding:"18px 22px",
              boxShadow:"0 16px 48px rgba(11,29,51,0.18)", minWidth:190,
              animation:"floatCard 4s ease-in-out infinite",
            }}>
              <style>{`@keyframes floatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#67788D", marginBottom:6 }}>Supply chains at risk</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:"#0B1D33", lineHeight:1 }}>80<span style={{ fontSize:20 }}>%</span></div>
              <div style={{ fontSize:12, color:"#67788D", marginTop:5, lineHeight:1.4 }}>of ESG exposure sits in the supply chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Credibility strip ── */}
      <div style={{ background:"#0B1D33", padding:"18px 6%", overflow:"hidden" }}>
        <div style={{ maxWidth:1160, margin:"0 auto", display:"flex", alignItems:"center", gap:0, flexWrap:"wrap" }}>
          {STATS.map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:0, flex:"1 1 auto", minWidth:160, padding:"8px 24px", borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,0.1)":undefined }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"#F2EBD9" }}>{s.value}</div>
                <div style={{ fontSize:12, color:"rgba(242,235,217,0.45)", marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Problems ── */}
      <section id="problems" style={{ padding:"100px 6%", background:"#172E4A" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(242,235,217,0.4)", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ display:"inline-block", width:18, height:1.5, background:"rgba(242,235,217,0.3)" }}/>
            Six procurement problems
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,3.5vw,44px)", fontWeight:700, color:"#F2EBD9", letterSpacing:"-0.025em", marginBottom:48, lineHeight:1.15 }}>
            The risks quietly building<br/>in your supply chain
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {PROBLEMS.map(p=>(
              <div key={p.n} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"24px 26px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:600, color:"rgba(242,235,217,0.25)", marginBottom:12 }}>{p.n}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#F2EBD9", marginBottom:10, lineHeight:1.3 }}>{p.title}</div>
                <div style={{ fontSize:13, color:"rgba(242,235,217,0.55)", lineHeight:1.7 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section id="features" style={{ padding:"100px 6%", background:"#F2EBD9" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#18664A", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ display:"inline-block", width:18, height:1.5, background:"#18664A" }}/>
              The Platform
              <span style={{ display:"inline-block", width:18, height:1.5, background:"#18664A" }}/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,3.5vw,44px)", fontWeight:700, color:"#0B1D33", letterSpacing:"-0.025em", marginBottom:12, lineHeight:1.2 }}>Everything needed for<br/>impact procurement</h2>
            <p style={{ fontSize:15, color:"#67788D", maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>Built from the ground up for ESG-first sourcing. Not an ESG tab added after launch.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {FEATURES.map(f=>(
              <div key={f.title} style={{ background:"#fff", border:"1px solid #D4C9B5", borderRadius:12, padding:"26px 28px", boxShadow:"0 2px 12px rgba(11,29,51,0.07)", transition:"box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 8px 32px rgba(11,29,51,0.12)"; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 2px 12px rgba(11,29,51,0.07)"; e.currentTarget.style.transform=""; }}>
                <div style={{ fontSize:28, marginBottom:16 }}>{f.icon}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#0B1D33", marginBottom:8, lineHeight:1.3 }}>{f.title}</div>
                <div style={{ fontSize:13, color:"#67788D", lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding:"80px 6%", background:"#fff" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,36px)", fontWeight:700, color:"#0B1D33", letterSpacing:"-0.02em", marginBottom:8 }}>10 procurement categories</h2>
            <p style={{ fontSize:14, color:"#67788D" }}>Controlled taxonomy shared across all vendors and buyers for precise matching</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {CATEGORIES.map(c=>(
              <div key={c.name} style={{ textAlign:"center", padding:"20px 12px", background:"#F2EBD9", border:"1px solid #D4C9B5", borderRadius:10, cursor:"pointer", transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#18664A"; e.currentTarget.style.background="#E4F2EB"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#D4C9B5"; e.currentTarget.style.background="#F2EBD9"; }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12, color:"#0B1D33", lineHeight:1.3 }}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESG Scoring ── */}
      <section id="esg" style={{ padding:"100px 6%", background:"#F2EBD9" }}>
        <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#18664A", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"inline-block", width:18, height:1.5, background:"#18664A" }}/>
              ESG Scoring Framework
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,3vw,38px)", fontWeight:700, color:"#0B1D33", letterSpacing:"-0.025em", marginBottom:16, lineHeight:1.2 }}>India's most rigorous<br/>vendor ESG scorecard</h2>
            <p style={{ fontSize:15, color:"#67788D", lineHeight:1.75, marginBottom:28 }}>25-field assessment across Environmental (30%), Social (45%), and Governance (25%) pillars. Every score is auditable, explainable, and updated in real time.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { pct:"30%", label:"Environmental", items:"Carbon · Renewables · Packaging · Waste", color:"#18664A", bg:"#E4F2EB" },
                { pct:"45%", label:"Social",         items:"Women employment · Jobs · Wages · Training", color:"#0B1D33", bg:"#E9DFC6" },
                { pct:"25%", label:"Governance",     items:"Ownership · Compliance · Transparency", color:"#B8720A", bg:"#FDF3E4" },
              ].map(p=>(
                <div key={p.label} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:48, height:48, borderRadius:10, background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:p.color }}>{p.pct}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#0B1D33", marginBottom:3 }}>{p.label}</div>
                    <div style={{ fontSize:12, color:"#67788D" }}>{p.items}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {ESG_BANDS.map(b=>(
              <div key={b.band} style={{ padding:"18px 20px", background:"#fff", borderRadius:12, border:`1.5px solid ${b.color}25`, display:"flex", alignItems:"center", gap:16, boxShadow:"0 2px 12px rgba(11,29,51,0.06)" }}>
                <div style={{ width:52, height:52, borderRadius:10, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:b.color }}>{b.range}</span>
                </div>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:b.color, marginBottom:3 }}>{b.band}</div>
                  <div style={{ fontSize:12, color:"#67788D", lineHeight:1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"100px 6%", background:"#0B1D33", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:"70vw", height:"70vw", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(242,235,217,0.4)", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ display:"inline-block", width:18, height:1.5, background:"rgba(242,235,217,0.3)" }}/>
            Get started today
            <span style={{ display:"inline-block", width:18, height:1.5, background:"rgba(242,235,217,0.3)" }}/>
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(30px,4vw,52px)", fontWeight:700, color:"#F2EBD9", letterSpacing:"-0.025em", marginBottom:16, lineHeight:1.2 }}>
            Ready to source with purpose?
          </h2>
          <p style={{ fontSize:16, color:"rgba(242,235,217,0.6)", maxWidth:440, margin:"0 auto 40px", lineHeight:1.7 }}>
            Join India's first ESG-first procurement platform. Free to register. No credit card required.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>navigate("/register")}
              style={{ padding:"15px 36px", background:"#18664A", border:"none", borderRadius:6, color:"white", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, transition:"all 0.2s", boxShadow:"0 8px 28px rgba(24,102,74,0.4)" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#22895F"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="#18664A"; e.currentTarget.style.transform=""; }}>
              Register as a vendor →
            </button>
            <button onClick={()=>navigate("/register")}
              style={{ padding:"15px 36px", background:"transparent", border:"1.5px solid rgba(242,235,217,0.25)", borderRadius:6, color:"#F2EBD9", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, transition:"all 0.2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(242,235,217,0.6)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(242,235,217,0.25)"; }}>
              Source as a buyer
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background:"#0B1D33", borderTop:"1px solid rgba(255,255,255,0.07)", padding:"24px 6%", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:22, height:22, borderRadius:5, background:"#18664A", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L9 3V7L5 9L1 7V3L5 1Z" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:"rgba(242,235,217,0.6)", fontSize:13 }}>Even Procurement</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(242,235,217,0.3)" }}>© 2026 Even Livelihoods Pvt Ltd · contact@evencargo.in</div>
        <div style={{ display:"flex", gap:18 }}>
          {["Privacy","Terms","Contact"].map(l=>(
            <span key={l} style={{ fontSize:12, color:"rgba(242,235,217,0.35)", cursor:"pointer", transition:"color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="rgba(242,235,217,0.8)"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(242,235,217,0.35)"}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
