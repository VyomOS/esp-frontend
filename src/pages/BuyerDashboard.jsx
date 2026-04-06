import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { buyerAPI, vendorAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Input, Textarea, Select, Modal, SectionHeader, Tabs, Empty, Stars } from "../components/UI";
import { useLocation, useNavigate } from "react-router-dom";

export default function BuyerDashboard() {
  const location = useLocation();
  const tab = location.pathname.includes("my-requests")    ? "my-requests"
    : location.pathname.includes("vendors")                ? "vendors"
    : location.pathname.includes("notifications")          ? "notifications"
    : "overview";
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <Tabs
          tabs={[
            { id: "overview",      label: "Overview",      icon: "⬡" },
            { id: "my-requests",   label: "My Requests",   icon: "◈" },
            { id: "vendors",       label: "Find Vendors",  icon: "◇" },
            { id: "notifications", label: "Notifications", icon: "◻" },
          ]}
          active={tab}
          onChange={(id) => navigate(id === "overview" ? "/dashboard" : `/dashboard/${id}`)}
        />
      </div>
      {tab === "overview"      && <BuyerOverview    toast={toast} />}
      {tab === "my-requests"   && <MyRequests       toast={toast} />}
      {tab === "vendors"       && <FindVendors      toast={toast} />}
      {tab === "notifications" && <Notifications    toast={toast} />}
    </Layout>
  );
}

// ── Overview ──────────────────────────────────────────────
function BuyerOverview({ toast, onTab }) {
  const [reqs, setReqs]       = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      buyerAPI.getMyRequests(),
      vendorAPI.getRanked(),
    ]).then(([r, v]) => {
      if (r.status === "fulfilled") setReqs(r.value.data);
      if (v.status === "fulfilled") setVendors(v.value.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
  </div>;

  const active = reqs.filter(r => r.status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Total Requests" value={reqs.length} icon="◈" color="var(--accent)" />
        <StatCard label="Active Requests" value={active} icon="⬡" color="var(--accent3)" sub={`${reqs.length - active} closed`} />
        <StatCard label="Verified Vendors" value={vendors.length} icon="◇" color="var(--accent2)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <SectionHeader title="Recent Requests" action={<Btn size="sm" variant="ghost" onClick={() => onTab("my-requests")}>View all</Btn>} />
          {reqs.length === 0 ? <Empty icon="◈" title="No requests yet" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reqs.slice(0, 4).map(r => (
                <div key={r.id} style={{ padding: "12px", background: "var(--bg2)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{r.category} · {r.location}</div>
                  </div>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader title="Top Vendors" action={<Btn size="sm" variant="ghost" onClick={() => onTab("vendors")}>Find more</Btn>} />
          {vendors.length === 0 ? <Empty icon="◇" title="No verified vendors" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {vendors.slice(0, 4).map((v, i) => (
                <div key={v.vendor_id} style={{ padding: "12px", background: "var(--bg2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>⭐ {v.avg_rating.toFixed(1)} · ESG {v.esg_score.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── My Requests ───────────────────────────────────────────
function MyRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [aiModal, setAiModal]   = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rateModal, setRateModal] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", budget: "", deadline: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => buyerAPI.getMyRequests().then(r => setRequests(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    try {
      await buyerAPI.createRequest(form);
      toast.success("Request posted!");
      setModal(false);
      setForm({ title: "", description: "", category: "", location: "", budget: "", deadline: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const closeReq = async id => {
    try { await buyerAPI.closeRequest(id, { close_reason: "Closed by buyer" }); toast.success("Request closed"); load(); }
    catch { toast.error("Failed"); }
  };

  const del = async id => {
    try { await buyerAPI.deleteRequest(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const getAiMatch = async id => {
    setAiModal(id); setAiResults(null); setAiLoading(true);
    try {
      const res = await buyerAPI.aiMatch(id);
      const matches = res.data.matches?.matches || res.data.matches || [];
      setAiResults(Array.isArray(matches) ? matches : []);
    } catch { toast.error("AI matching failed"); setAiResults([]); }
    finally { setAiLoading(false); }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  if (loading) return <div style={{ display: "grid", gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}</div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="My Procurement Requests" sub="Manage your sourcing requirements"
        action={<Btn onClick={() => setModal(true)}>+ New Request</Btn>} />

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "active", "completed", "closed"].map(f => (
          <Btn key={f} onClick={() => setFilter(f)} variant={filter === f ? "primary" : "secondary"} size="sm">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Btn>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon="◈" title="No requests yet" desc="Post your first procurement requirement"
          action={<Btn onClick={() => setModal(true)}>Post Request</Btn>} />
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map(r => (
            <Card key={r.id}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{r.description}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text3)", flexWrap: "wrap" }}>
                    {r.category && <span>🏷 {r.category}</span>}
                    {r.location && <span>📍 {r.location}</span>}
                    {r.budget   && <span>💰 {r.budget}</span>}
                    {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                    <span>🗓 {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`badge ${r.status}`}>{r.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                {r.status === "active" && <>
                  <Btn onClick={() => getAiMatch(r.id)} variant="secondary" size="sm">🤖 AI Match</Btn>
                  <Btn onClick={() => closeReq(r.id)} variant="ghost" size="sm">Close</Btn>
                </>}
                <Btn onClick={() => setRateModal(r)} variant="ghost" size="sm">⭐ Rate Vendor</Btn>
                <Btn onClick={() => del(r.id)} variant="danger" size="sm">Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Post Procurement Request" width={580}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Title *" placeholder="What do you need?" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Description *" placeholder="Describe your requirement in detail..." rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Category" placeholder="e.g. Agriculture" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            <Input label="Location" placeholder="City, State" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            <Input label="Budget" placeholder="₹10,000 - ₹50,000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <Btn onClick={create} loading={saving} fullWidth size="lg">Post Request</Btn>
        </div>
      </Modal>

      {/* AI Match Modal */}
      <Modal open={!!aiModal} onClose={() => { setAiModal(null); setAiResults(null); }} title="🤖 AI Vendor Matching" width={520}>
        {aiLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 16px" }} />
            <div style={{ color: "var(--text2)" }}>Finding best vendors...</div>
          </div>
        ) : aiResults?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {aiResults.map((m, i) => (
              <div key={i} style={{ padding: "16px", background: "var(--surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 700 }}>{m.vendor_name || m.name}</div>
                  <span style={{ background: "var(--accent)", color: "white", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {m.score}%
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{m.reason}</div>
              </div>
            ))}
          </div>
        ) : aiResults !== null ? (
          <Empty icon="◇" title="No matches found" desc="No verified vendors match this requirement yet" />
        ) : null}
      </Modal>

      {/* Rate Vendor Modal */}
      <RateVendorModal open={!!rateModal} onClose={() => setRateModal(null)} toast={toast} />
    </div>
  );
}

function RateVendorModal({ open, onClose, toast }) {
  const [vendorId, setVendorId] = useState("");
  const [rating, setRating]     = useState(0);
  const [review, setReview]     = useState("");
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!vendorId || !rating) { toast.error("Enter vendor ID and rating"); return; }
    setSaving(true);
    try {
      await buyerAPI.rateVendor({ vendor_id: Number(vendorId), rating, review });
      toast.success("Rating submitted!");
      onClose();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Rate a Vendor" width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Vendor ID" type="number" placeholder="Enter vendor ID" value={vendorId} onChange={e => setVendorId(e.target.value)} />
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", display: "block", marginBottom: 8 }}>Rating</label>
          <Stars value={rating} onChange={setRating} size={28} />
        </div>
        <Textarea label="Review (optional)" placeholder="Share your experience..." value={review} onChange={e => setReview(e.target.value)} />
        <Btn onClick={save} loading={saving} fullWidth>Submit Rating</Btn>
      </div>
    </Modal>
  );
}

// ── Find Vendors ──────────────────────────────────────────
function FindVendors({ toast }) {
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");
  const [location, setLocation]     = useState("");
  const [view, setView]             = useState("ranked");
  const [selected, setSelected]     = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openVendor = async (vendor) => {
    setSelected(vendor);
    setDetailLoading(true);
    try {
      const id = vendor.vendor_id || vendor.id;
      const [profile, esg, rating] = await Promise.allSettled([
        vendorAPI.getVendor(id),
        vendorAPI.getESG(id),
        buyerAPI.getRating(id),
      ]);
      setVendorDetail({
        profile: profile.status === "fulfilled" ? profile.value.data : null,
        esg:     esg.status === "fulfilled"     ? esg.value.data     : [],
        rating:  rating.status === "fulfilled"  ? rating.value.data  : null,
      });
    } catch {
      toast.error("Failed to load vendor details");
    } finally {
      setDetailLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      if (view === "ranked") {
        const r = await vendorAPI.getRanked();
        setVendors(r.data);
      } else {
        const r = await vendorAPI.listVendors({ search, category, location });
        setVendors(r.data);
      }
    } catch { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [view]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Find Vendors" sub="Browse verified vendors on the platform" />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} icon="🔍" />
        </div>
        <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 160 }} />
        <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} style={{ width: 160 }} />
        <Btn onClick={load}>Search</Btn>
        <Btn onClick={() => setView(v => v === "ranked" ? "all" : "ranked")} variant="secondary">
          {view === "ranked" ? "Show All" : "Show Ranked"}
        </Btn>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : vendors.length === 0 ? (
        <Empty icon="◇" title="No vendors found" desc="Try different search terms" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {vendors.map((v, i) => (
            <Card key={v.vendor_id || v.id} glow={i === 0 && view === "ranked"} onClick={() => openVendor(v)}>
              {i === 0 && view === "ranked" && (
                <div style={{ marginBottom: 12 }}>
                  <span className="badge verified">🏆 Top Ranked</span>
                </div>
              )}
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{v.name || v.organization_name}</div>
              {v.category && <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>🏷 {v.category}</div>}
              {v.location && <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>📍 {v.location}</div>}
              {v.description && <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, lineHeight: 1.6 }}>{v.description?.slice(0, 80)}...</div>}
              {view === "ranked" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--warn)" }}>⭐ {v.avg_rating?.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>Rating</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--accent3)" }}>{v.esg_score?.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>ESG</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--accent)" }}>{v.final_score?.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>Score</div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {/* Vendor Detail Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setVendorDetail(null); }} title="Vendor Profile" width={580}>
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 16px" }} />
            <div style={{ color: "var(--text2)" }}>Loading vendor details...</div>
          </div>
        ) : vendorDetail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, var(--accent), var(--accent2))", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                🏭
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
                  {vendorDetail.profile?.organization_name || selected?.name}
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {vendorDetail.profile?.category && <span className="badge active">🏷 {vendorDetail.profile.category}</span>}
                  {vendorDetail.profile?.location  && <span style={{ fontSize: 13, color: "var(--text2)" }}>📍 {vendorDetail.profile.location}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--warn)" }}>
                  ⭐ {vendorDetail.rating?.average_rating?.toFixed(1) || "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{vendorDetail.rating?.total_reviews || 0} reviews</div>
              </div>
            </div>

            {/* Description */}
            {vendorDetail.profile?.description && (
              <div style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{vendorDetail.profile.description}</div>
              </div>
            )}

            {/* Contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {vendorDetail.profile?.phone && (
                <div style={{ padding: "12px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Phone</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>📞 {vendorDetail.profile.phone}</div>
                </div>
              )}
              {vendorDetail.profile?.website && (
                <div style={{ padding: "12px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Website</div>
                  <a href={vendorDetail.profile.website} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>🔗 Visit Website</a>
                </div>
              )}
            </div>

            {/* ESG Metrics */}
            {vendorDetail.esg?.length > 0 && (
              <div>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--accent3)" }}>🌱 ESG Impact</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Jobs Created",    value: vendorDetail.esg[0].jobs_created,   color: "var(--accent)",  icon: "👷" },
                    { label: "Women Employed",  value: vendorDetail.esg[0].women_employed, color: "var(--accent2)", icon: "👩" },
                    { label: "Carbon Saved",    value: `${vendorDetail.esg[0].carbon_saved}t`, color: "var(--accent3)", icon: "🌿" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "14px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${m.color}25`, textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                      <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {vendorDetail.esg[0].msme_certified && (
                  <div style={{ marginTop: 10 }}><span className="badge verified">✓ MSME Certified</span></div>
                )}
              </div>
            )}

            {/* Score */}
            {selected?.final_score !== undefined && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Avg Rating", value: selected.avg_rating?.toFixed(1), color: "var(--warn)" },
                  { label: "ESG Score",  value: selected.esg_score?.toFixed(0),  color: "var(--accent3)" },
                  { label: "Final Score",value: selected.final_score?.toFixed(0),color: "var(--accent)" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: s.color }}>{s.value || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <Btn
                fullWidth
                onClick={() => { setSelected(null); setVendorDetail(null); }}
                variant="secondary"
              >
                Close
              </Btn>
            </div>

          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────
function Notifications({ toast }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => buyerAPI.getNotifications().then(r => setNotes(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try { await buyerAPI.markAllRead(); toast.success("All marked as read"); load(); }
    catch { toast.error("Failed"); }
  };

  const markOne = async id => {
    try { await buyerAPI.markRead(id); load(); }
    catch {}
  };

  if (loading) return <div style={{ display: "grid", gap: 8 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}</div>;

  const unread = notes.filter(n => !n.is_read).length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Notifications" sub={`${unread} unread`}
        action={unread > 0 && <Btn onClick={markAll} variant="ghost" size="sm">Mark all read</Btn>} />
      {notes.length === 0 ? (
        <Empty icon="◻" title="No notifications" desc="You're all caught up!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600 }}>
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOne(n.id)}
              style={{
                padding: "16px 20px", background: n.is_read ? "var(--surface)" : "rgba(99,132,255,0.08)",
                border: `1px solid ${n.is_read ? "var(--border)" : "var(--border2)"}`,
                borderRadius: "var(--radius-sm)", cursor: n.is_read ? "default" : "pointer",
                display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 20 }}>{n.type === "success" ? "✅" : n.type === "warning" ? "⚠️" : "ℹ️"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
