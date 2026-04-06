import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { adminAPI } from "../api/api";
import { useToast } from "../context/ToastContext";
import { Card, StatCard, Btn, Modal, SectionHeader, Tabs, Empty, Textarea, Input} from "../components/UI";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const tab = location.pathname.includes("vendors")       ? "vendors"
  : location.pathname.includes("users")                 ? "users"
  : location.pathname.includes("impact")                ? "impact"
  : location.pathname.includes("notifications")         ? "notifications"
  : "overview";
  const toast = useToast();

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <Tabs
          tabs={[
            { id: "overview", label: "Overview",   icon: "⬡" },
            { id: "vendors",  label: "Approvals",  icon: "◈" },
            { id: "users",    label: "Users",      icon: "◇" },
            { id: "impact",   label: "Impact",     icon: "◉" },
            { id: "notifications", label: "Notify Users", icon: "◻" },
          ]}
          active={tab}
          onChange={(id) => navigate(id === "overview" ? "/dashboard" : `/dashboard/${id}`)}
        />
      </div>
      {tab === "overview" && <AdminOverview toast={toast} />}
      {tab === "vendors"  && <VendorApproval toast={toast} />}
      {tab === "users"    && <UserManagement toast={toast} />}
      {tab === "impact"   && <ImpactDashboard toast={toast} />}
      {tab === "notifications" && <SendNotifications toast={toast} />}
    </Layout>
  );
}

// ── Overview ──────────────────────────────────────────────
function AdminOverview({ toast }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
    {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
  </div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Platform Overview" sub="Real-time statistics" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Total Users"       value={stats?.total_users       ?? 0} icon="◈" color="var(--accent)" />
        <StatCard label="Total Vendors"     value={stats?.total_vendors     ?? 0} icon="◇" color="var(--accent2)" />
        <StatCard label="Verified Vendors"  value={stats?.verified_vendors  ?? 0} icon="⬡" color="var(--accent3)" sub={`${stats?.total_vendors - stats?.verified_vendors} pending`} />
        <StatCard label="Total Buyers"      value={stats?.total_buyers      ?? 0} icon="◻" color="var(--warn)" />
        <StatCard label="Total Requests"    value={stats?.total_requests    ?? 0} icon="◈" color="var(--accent)" />
        <StatCard label="Active Requests"   value={stats?.active_requests   ?? 0} icon="⬡" color="var(--accent3)" />
      </div>
    </div>
  );
}

// ── Vendor Approval ───────────────────────────────────────
function VendorApproval({ toast }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docModal, setDocModal] = useState(null);
  const [docs, setDocs]         = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting]       = useState(false);

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error("Please enter a reason"); return; }
    setRejecting(true);
    try {
      await adminAPI.rejectVendor(rejectTarget.vendor_id, rejectReason);
      toast.success("Vendor rejected and notified");
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch { toast.error("Failed"); }
    finally { setRejecting(false); }
  };

  const load = () => adminAPI.pendingVendors().then(r => setVendors(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const verify = async id => {
    try { await adminAPI.verifyVendor(id); toast.success("Vendor verified! Email sent."); load(); }
    catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const viewDocs = async id => {
    try {
      const res = await adminAPI.vendorDocuments(id);
      setDocs(res.data);
      setDocModal(id);
    } catch { toast.error("Failed to load documents"); }
  };

  if (loading) return <div style={{ display: "grid", gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Pending Vendor Approvals" sub={`${vendors.length} vendors awaiting verification`} />
      {vendors.length === 0 ? (
        <Empty icon="✅" title="All vendors verified!" desc="No pending approvals at the moment" />
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {vendors.map(v => (
            <Card key={v.vendor_id}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{v.organization_name}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text2)", marginBottom: 8, flexWrap: "wrap" }}>
                    <span>📧 {v.user_email}</span>
                    <span>👤 {v.user_name}</span>
                    {v.location && <span>📍 {v.location}</span>}
                    {v.category && <span>🏷 {v.category}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge ${v.document_count > 0 ? "verified" : "danger"}`}>
                      {v.document_count} document{v.document_count !== 1 ? "s" : ""}
                    </span>
                    <span className="badge pending">Pending verification</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Btn onClick={() => viewDocs(v.vendor_id)} variant="secondary" size="sm">View Docs</Btn>
                  <Btn onClick={() => verify(v.vendor_id)} variant="success" size="sm" disabled={v.document_count === 0}>
                    ✓ Verify
                  </Btn>
                  <Btn onClick={() => setRejectTarget(v)} variant="danger" size="sm">✕ Reject</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!docModal} onClose={() => { setDocModal(null); setDocs([]); }} title="Vendor Documents" width={560}>
        {docs.length === 0 ? (
          <Empty icon="◻" title="No documents uploaded" desc="Vendor hasn't uploaded any documents yet" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {docs.map(d => (
              <div key={d.id} style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📄</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.original_name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                      <span className="badge pending" style={{ marginRight: 8 }}>{d.document_type?.toUpperCase()}</span>
                      {new Date(d.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <a
                  href={adminAPI.downloadDocument(d.id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: "6px 14px", background: "var(--accent)", color: "white", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Reject Vendor" width={460}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "14px 16px", background: "rgba(248,113,113,0.08)", borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)", fontSize: 14, color: "var(--text2)" }}>
            Rejecting <strong style={{ color: "var(--text)" }}>{rejectTarget?.organization_name}</strong>. The vendor will be notified with your reason and can re-upload documents.
          </div>
          <Textarea
            label="Rejection Reason *"
            placeholder="e.g. PAN card image is blurry, please re-upload a clearer copy..."
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => { setRejectTarget(null); setRejectReason(""); }} variant="secondary" fullWidth>Cancel</Btn>
            <Btn onClick={reject} loading={rejecting} variant="danger" fullWidth>Send Rejection</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── User Management ───────────────────────────────────────
function UserManagement({ toast }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");

  const load = params => adminAPI.listUsers(params).then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load({}); }, []);

  const toggleActive = async (id, current) => {
    try {
      await adminAPI.updateUser(id, { is_active: !current });
      toast.success(current ? "User deactivated" : "User activated");
      load({});
    } catch { toast.error("Failed"); }
  };

  const filtered = users.filter(u => {
    const matchRole   = filter === "all" || u.role === filter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) return <div style={{ display: "grid", gap: 8 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}</div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="User Management" sub={`${users.length} total users`} />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "10px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none" }}
        />
        {["all", "vendor", "buyer", "admin"].map(f => (
          <Btn key={f} onClick={() => setFilter(f)} variant={filter === f ? "primary" : "secondary"} size="sm">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Btn>
        ))}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Verified</span><span>Status</span><span>Action</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>No users found</div>
        ) : (
          filtered.map((u, i) => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div style={{ color: "var(--text2)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
              <span className={`badge ${u.role === "admin" ? "danger" : u.role === "vendor" ? "active" : "verified"}`}>{u.role}</span>
              <span>{u.email_verified ? "✅" : "❌"}</span>
              <span className={`badge ${u.is_active ? "verified" : "closed"}`}>{u.is_active ? "Active" : "Inactive"}</span>
              <Btn onClick={() => toggleActive(u.id, u.is_active)} variant={u.is_active ? "danger" : "success"} size="sm">
                {u.is_active ? "Deactivate" : "Activate"}
              </Btn>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Impact Dashboard ──────────────────────────────────────
function ImpactDashboard({ toast }) {
  const [impact, setImpact]   = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([adminAPI.impact(), adminAPI.esgBreakdown()])
      .then(([i, b]) => {
        if (i.status === "fulfilled") setImpact(i.value.data);
        if (b.status === "fulfilled") setBreakdown(b.value.data);
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
    {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
  </div>;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="ESG Impact Dashboard" sub="Platform-wide social and environmental impact" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Vendors"     value={impact?.total_vendors ?? 0}        icon="◇" color="var(--accent)" />
        <StatCard label="Verified Vendors"  value={impact?.verified_vendors ?? 0}     icon="⬡" color="var(--accent3)" />
        <StatCard label="Jobs Created"      value={impact?.total_jobs_created ?? 0}   icon="👷" color="var(--accent2)" sub="Through verified vendors" />
        <StatCard label="Women Employed"    value={impact?.total_women_employed ?? 0} icon="👩" color="var(--warn)" />
        <StatCard label="Carbon Saved"      value={`${(impact?.total_carbon_saved ?? 0).toFixed(1)}t`} icon="🌱" color="var(--accent3)" sub="CO₂ equivalent" />
        <StatCard label="Total Buyers"      value={impact?.total_buyers ?? 0}         icon="🛒" color="var(--accent)" />
      </div>

      {breakdown.length > 0 && (
        <Card>
          <h3 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, marginBottom: 24 }}>ESG by Vendor</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Vendor", "Jobs Created", "Women Employed", "Carbon Saved (t)"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{row.vendor}</td>
                    <td style={{ padding: "12px", color: "var(--accent2)" }}>{row.jobs}</td>
                    <td style={{ padding: "12px", color: "var(--warn)" }}>{row.women}</td>
                    <td style={{ padding: "12px", color: "var(--accent3)" }}>{row.carbon.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SendNotifications({ toast }) {
  const [message, setMessage] = useState("");
  const [target, setTarget]   = useState("all");
  const [type, setType]       = useState("info");
  const [sending, setSending] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails]         = useState([]);

  const addEmail = () => {
    const val = emailInput.trim().toLowerCase();
    if (!val) return;
    if (!val.includes("@")) { toast.error("Enter a valid email"); return; }
    if (emails.includes(val)) { toast.error("Already added"); return; }
    setEmails(p => [...p, val]);
    setEmailInput("");
  };

  const removeEmail = (email) => setEmails(p => p.filter(e => e !== email));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const send = async () => {
    if (!message.trim()) { toast.error("Enter a message"); return; }
    if (target === "individual" && emails.length === 0) { toast.error("Add at least one email"); return; }
    setSending(true);
    try {
      const res = await adminAPI.sendNotification({ message, target, emails, type });
      const data = res.data;
      toast.success(data.message);
      if (data.not_found?.length > 0) {
        toast.error(`Not found: ${data.not_found.join(", ")}`);
      }
      setMessage("");
      setEmails([]);
      setEmailInput("");
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth: 580, animation: "fadeUp 0.4s ease" }}>
      <SectionHeader title="Send Notifications" sub="Broadcast messages to users on the platform" />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Target */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>Send To</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "individual"].map(t => (
                <button key={t} onClick={() => setTarget(t)} style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  border: `2px solid ${target === t ? "var(--accent)" : "var(--border)"}`,
                  background: target === t ? "rgba(99,132,255,0.1)" : "var(--surface)",
                  color: target === t ? "var(--accent)" : "var(--text2)",
                  cursor: "pointer", fontFamily: "Syne", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                }}>
                  {t === "all" ? "👥 Everyone" : "👤 Specific Users"}
                </button>
              ))}
            </div>
          </div>

          {/* Email input for individual */}
          {target === "individual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Add Recipients
              </label>

              {/* Tag chips */}
              {emails.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)", minHeight: 44 }}>
                  {emails.map(email => (
                    <div key={email} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 10px 4px 12px", background: "rgba(99,132,255,0.12)",
                      border: "1px solid rgba(99,132,255,0.25)", borderRadius: 20,
                      fontSize: 13, color: "var(--accent)", fontWeight: 500,
                    }}>
                      {email}
                      <button onClick={() => removeEmail(email)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--accent)", fontSize: 16, lineHeight: 1,
                        padding: "0 2px", display: "flex", alignItems: "center",
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Enter email and press Enter or comma..."
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1, padding: "11px 16px",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, color: "var(--text)", fontSize: 14, outline: "none",
                    fontFamily: "DM Sans, sans-serif", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"}
                />
                <Btn onClick={addEmail} variant="secondary" size="md">Add</Btn>
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                Press <kbd style={{ background: "var(--surface2)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>Enter</kbd> or <kbd style={{ background: "var(--surface2)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>,</kbd> to add each email. {emails.length} recipient{emails.length !== 1 ? "s" : ""} added.
              </div>
            </div>
          )}

          {/* Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>Notification Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "info",    label: "ℹ Info",    color: "var(--accent)"  },
                { id: "success", label: "✅ Success", color: "var(--accent3)" },
                { id: "warning", label: "⚠ Warning", color: "var(--warn)"    },
              ].map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  flex: 1, padding: "9px", borderRadius: 8,
                  border: `2px solid ${type === t.id ? t.color : "var(--border)"}`,
                  background: type === t.id ? `${t.color}18` : "var(--surface)",
                  color: type === t.id ? t.color : "var(--text2)",
                  cursor: "pointer", fontFamily: "Syne", fontWeight: 600, fontSize: 12, transition: "all 0.2s",
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <Textarea
            label="Message *"
            placeholder="Type your notification message here..."
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          {/* Preview */}
          {message && (
            <div style={{ padding: "12px 16px", background: "rgba(99,132,255,0.06)", borderRadius: 10, border: "1px solid var(--border2)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600, color: "var(--text)", marginRight: 8 }}>Preview:</span>
              {message}
            </div>
          )}

          <Btn onClick={send} loading={sending} fullWidth size="lg">
            {target === "all"
              ? "📢 Broadcast to Everyone"
              : `📨 Send to ${emails.length || 0} User${emails.length !== 1 ? "s" : ""}`}
          </Btn>

        </div>
      </Card>
    </div>
  );
}
