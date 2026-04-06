import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { vendorAPI, buyerAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Input, Textarea, Select, Modal, SectionHeader, Tabs, Empty, Progress } from "../components/UI";
import { useLocation, useNavigate } from "react-router-dom";

export default function VendorDashboard() {
  const location = useLocation();
  const tab = location.pathname.includes("profile")   ? "profile"
    : location.pathname.includes("services")          ? "services"
    : location.pathname.includes("documents")         ? "documents"
    : location.pathname.includes("esg")               ? "esg"
    : location.pathname.includes("requests")          ? "requests"
    : "overview";
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <Tabs
          tabs={[
            { id: "overview",   label: "Overview",   icon: "⬡" },
            { id: "profile",    label: "Profile",    icon: "◈" },
            { id: "services",   label: "Services",   icon: "◇" },
            { id: "documents",  label: "Documents",  icon: "◻" },
            { id: "esg",        label: "ESG",        icon: "◉" },
            { id: "requests",   label: "Requests",   icon: "◈" },
          ]}
          active={tab}
          onChange={(id) => navigate(id === "overview" ? "/dashboard" : `/dashboard/${id}`)}
        />
      </div>
      {tab === "overview"  && <VendorOverview toast={toast} />}
      {tab === "profile"   && <VendorProfile  toast={toast} />}
      {tab === "services"  && <VendorServices toast={toast} />}
      {tab === "documents" && <VendorDocuments toast={toast} />}
      {tab === "esg"       && <VendorESG      toast={toast} />}
      {tab === "requests"  && <BrowseRequests toast={toast} />}
    </Layout>
  );
}

// ── Overview ──────────────────────────────────────────────
function VendorOverview({ toast }) {
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [docs, setDocs] = useState([]);
  const [esg, setEsg]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      vendorAPI.getMyProfile(),
      vendorAPI.getMyServices(),
      vendorAPI.getMyDocuments(),
    ]).then(([p, s, d]) => {
      if (p.status === "fulfilled") {
        setProfile(p.value.data);
        vendorAPI.getESG(p.value.data.id).then(r => setEsg(r.data)).catch(() => {});
      }
      if (s.status === "fulfilled") setServices(s.value.data);
      if (d.status === "fulfilled") setDocs(d.value.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
    {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
  </div>;

  const latestESG = esg[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Profile Status" value={profile?.user_id ? "Active" : "Incomplete"} icon="◈" color="var(--accent)" />
        <StatCard label="Services Listed" value={services.length} icon="◇" color="var(--accent2)" />
        <StatCard label="Documents" value={docs.length} icon="◻" color="var(--warn)" sub={docs.length === 0 ? "Upload for verification" : "Uploaded"} />
        <StatCard label="Jobs Created" value={latestESG?.jobs_created ?? "—"} icon="◉" color="var(--accent3)" />
      </div>

      {profile && (
        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", align: "center", gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 700 }}>{profile.organization_name}</h3>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, maxWidth: 500 }}>{profile.description}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, color: "var(--text2)" }}>
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.category && <span>🏷 {profile.category}</span>}
                {profile.website  && <a href={profile.website} style={{ color: "var(--accent)" }}>🔗 Website</a>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {docs.length === 0 && (
        <Card style={{ borderColor: "var(--warn)", background: "rgba(251,191,36,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 32 }}>⚠️</div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 4 }}>Upload documents to get verified</div>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>Upload PAN, Aadhaar, or GST certificate to get your profile verified by admin.</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────
function VendorProfile({ toast }) {
  const [form, setForm] = useState({ organization_name: "", description: "", location: "", category: "", website: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    vendorAPI.getMyProfile()
      .then(r => { setForm(r.data); setHasProfile(true); })
      .catch(() => setHasProfile(false))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (hasProfile) await vendorAPI.updateProfile(form);
      else { await vendorAPI.createProfile(form); setHasProfile(true); }
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  const cats = [{ value: "", label: "Select category" }, "Agriculture", "Technology", "Manufacturing", "Services", "Healthcare", "Education", "Construction", "Retail"].map(c => typeof c === "string" ? { value: c, label: c } : c);

  return (
    <div style={{ maxWidth: 600, animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title={hasProfile ? "Edit Profile" : "Create Profile"} sub="Your public vendor profile visible to buyers" />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Organization Name *" placeholder="Your company name" value={form.organization_name}
            onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} />
          <Textarea label="Description *" placeholder="Describe your services and expertise..." rows={4} value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Location" placeholder="City, State" value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            <Select label="Category" options={cats} value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            <Input label="Website" placeholder="https://..." value={form.website}
              onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
            <Input label="Phone" placeholder="+91 XXXXX XXXXX" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <Btn onClick={save} loading={saving} size="lg">{hasProfile ? "Save Changes" : "Create Profile"}</Btn>
        </div>
      </Card>
    </div>
  );
}

// ── Services ──────────────────────────────────────────────
function VendorServices({ toast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ title: "", description: "", category: "", price_range: "", unit: "" });
  const [saving, setSaving]     = useState(false);

  const load = () => vendorAPI.getMyServices().then(r => setServices(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await vendorAPI.addService(form);
      toast.success("Service added!");
      setModal(false);
      setForm({ title: "", description: "", category: "", price_range: "", unit: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try { await vendorAPI.deleteService(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div style={{ display: "grid", gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Services & Products" sub="What you offer to buyers"
        action={<Btn onClick={() => setModal(true)} size="sm">+ Add Service</Btn>} />
      {services.length === 0 ? (
        <Empty icon="◇" title="No services yet" desc="Add your services to appear in buyer searches"
          action={<Btn onClick={() => setModal(true)}>Add First Service</Btn>} />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {services.map(s => (
            <Card key={s.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>{s.description}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text3)" }}>
                  {s.category   && <span>🏷 {s.category}</span>}
                  {s.price_range && <span>💰 {s.price_range}</span>}
                  {s.unit        && <span>📦 per {s.unit}</span>}
                </div>
              </div>
              <Btn onClick={() => del(s.id)} variant="danger" size="sm">Delete</Btn>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Service">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Title *" placeholder="e.g. Organic Cotton Supply" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Description *" placeholder="Describe your service..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Category" placeholder="Agriculture" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            <Input label="Price Range" placeholder="₹500 - ₹2000" value={form.price_range} onChange={e => setForm(p => ({ ...p, price_range: e.target.value }))} />
            <Input label="Unit" placeholder="kg, piece, hour" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
          </div>
          <Btn onClick={save} loading={saving} fullWidth>Add Service</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────
function VendorDocuments({ toast }) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile]       = useState(null);
  const [docType, setDocType] = useState("pan");
  const [uploading, setUploading] = useState(false);

  const load = () => vendorAPI.getMyDocuments().then(r => setDocs(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file) { toast.error("Select a file first"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", docType);
      await vendorAPI.uploadDocument(fd);
      toast.success("Document uploaded!");
      setFile(null);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  const del = async id => {
    try { await vendorAPI.deleteDocument(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const docTypes = [
    { value: "pan", label: "PAN Card" },
    { value: "aadhaar", label: "Aadhaar Card" },
    { value: "gst", label: "GST Certificate" },
    { value: "registration", label: "Business Registration" },
    { value: "other", label: "Other" },
  ];

  const fmt = bytes => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="KYC Documents" sub="Upload documents for admin verification" />
      <Card style={{ marginBottom: 24 }}>
        <h4 style={{ fontFamily: "Syne", fontWeight: 600, marginBottom: 16 }}>Upload New Document</h4>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Select label="Document Type" options={docTypes} value={docType} onChange={e => setDocType(e.target.value)} style={{ minWidth: 180 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", display: "block", marginBottom: 6 }}>File (PDF or Image, max 10MB)</label>
            <div
              style={{ padding: "20px", border: `2px dashed ${file ? "var(--accent3)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", textAlign: "center", cursor: "pointer", background: file ? "rgba(52,211,153,0.05)" : "transparent", transition: "all 0.2s" }}
              onClick={() => document.getElementById("file-input").click()}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{file ? "✅" : "📄"}</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{file ? file.name : "Click to select file"}</div>
              <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files[0])} style={{ display: "none" }} />
            </div>
          </div>
          <Btn onClick={upload} loading={uploading} variant={file ? "primary" : "secondary"}>Upload</Btn>
        </div>
      </Card>

      {docs.length === 0 ? (
        <Empty icon="◻" title="No documents uploaded" desc="Upload at least one document to get verified" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {docs.map(d => (
            <Card key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 600, fontSize: 14 }}>{d.original_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                    <span className="badge pending" style={{ marginRight: 8 }}>{d.document_type.toUpperCase()}</span>
                    {d.file_size && fmt(d.file_size)} · {new Date(d.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Btn onClick={() => del(d.id)} variant="danger" size="sm">Remove</Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ESG ───────────────────────────────────────────────────
function VendorESG({ toast }) {
  const [profile, setProfile] = useState(null);
  const [existing, setExisting] = useState([]);
  const [form, setForm] = useState({ jobs_created: 0, women_employed: 0, carbon_saved: 0, local_sourcing_pct: 0, msme_certified: false, year: new Date().getFullYear() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vendorAPI.getMyProfile().then(r => {
      setProfile(r.data);
      vendorAPI.getESG(r.data.id).then(e => setExisting(e.data)).catch(() => {});
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await vendorAPI.addESG({ ...form, jobs_created: Number(form.jobs_created), women_employed: Number(form.women_employed), carbon_saved: Number(form.carbon_saved), local_sourcing_pct: Number(form.local_sourcing_pct) });
      toast.success("ESG metrics submitted!");
      if (profile) vendorAPI.getESG(profile.id).then(e => setExisting(e.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="ESG Metrics" sub="Environmental, Social & Governance impact data" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 800 }}>
        <Card>
          <h4 style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 20 }}>Submit Report</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Year" type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
            <Input label="Jobs Created" type="number" min="0" value={form.jobs_created} onChange={e => setForm(p => ({ ...p, jobs_created: e.target.value }))} />
            <Input label="Women Employed" type="number" min="0" value={form.women_employed} onChange={e => setForm(p => ({ ...p, women_employed: e.target.value }))} />
            <Input label="Carbon Saved (tonnes CO₂)" type="number" min="0" step="0.1" value={form.carbon_saved} onChange={e => setForm(p => ({ ...p, carbon_saved: e.target.value }))} />
            <Input label="Local Sourcing (%)" type="number" min="0" max="100" value={form.local_sourcing_pct} onChange={e => setForm(p => ({ ...p, local_sourcing_pct: e.target.value }))} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text2)" }}>
              <input type="checkbox" checked={form.msme_certified} onChange={e => setForm(p => ({ ...p, msme_certified: e.target.checked }))} />
              MSME Certified
            </label>
            <Btn onClick={save} loading={saving} fullWidth>Submit ESG Data</Btn>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {existing.slice(0, 1).map(e => (
            <Card key={e.id} glow>
              <h4 style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 20 }}>Latest Report {e.year && `(${e.year})`}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Progress label="Jobs Created" value={e.jobs_created} max={Math.max(e.jobs_created * 1.5, 10)} color="var(--accent)" />
                <Progress label="Women Employed" value={e.women_employed} max={Math.max(e.women_employed * 1.5, 10)} color="var(--accent2)" />
                <Progress label="Carbon Saved (t)" value={e.carbon_saved} max={Math.max(e.carbon_saved * 1.5, 10)} color="var(--accent3)" />
                <Progress label="Local Sourcing %" value={e.local_sourcing_pct} max={100} color="var(--warn)" />
                {e.msme_certified && <span className="badge verified">✓ MSME Certified</span>}
              </div>
            </Card>
          ))}
          {existing.length === 0 && (
            <Card><Empty icon="◉" title="No ESG data yet" desc="Submit your first report" /></Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Browse Requests ───────────────────────────────────────
function BrowseRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    buyerAPI.listRequests().then(r => setRequests(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display: "grid", gap: 12 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Browse Requests" sub="Active procurement requests from buyers" />
      <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} icon="🔍" className="mb-6" style={{ marginBottom: 20 }} />
      {filtered.length === 0 ? <Empty icon="◈" title="No requests found" /> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map(r => (
            <Card key={r.id}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>{r.description}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text3)", flexWrap: "wrap" }}>
                    {r.category && <span>🏷 {r.category}</span>}
                    {r.location && <span>📍 {r.location}</span>}
                    {r.budget   && <span>💰 {r.budget}</span>}
                    {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className="badge active">{r.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
