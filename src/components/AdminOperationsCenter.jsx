import { useEffect, useMemo, useState } from "react";
import { adminAPI, apiErrorMessage, vendorAPI } from "../api/api";

const ASSISTANCE_STATUSES = ["new", "contacted", "in_progress", "resolved", "closed"];
const today = () => new Date().toISOString().slice(0, 10);
const nextYear = () => { const date = new Date(); date.setFullYear(date.getFullYear() + 1); return date.toISOString().slice(0, 10); };

export default function AdminOperationsCenter({ toast }) {
  const [leads, setLeads] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [vci, setVci] = useState({ vendor_id: "", framework_version: "VCI 1.0", source_assessment_ref: "", composite_score: "", maturity_band: "", tier1_passed: false, issued_at: today(), expires_at: nextYear(), public_visible: true });

  const load = async () => {
    setLoading(true); setError("");
    const [leadResult, vendorResult] = await Promise.allSettled([adminAPI.assistanceLeads(), vendorAPI.listVendors({ limit: 100 })]);
    if (leadResult.status === "fulfilled") {
      const rows = leadResult.value.data || [];
      setLeads(rows);
      setDrafts(Object.fromEntries(rows.map(item => [item.id, { status: item.status, assignee: item.assignee || "", admin_notes: item.admin_notes || "" }])));
    } else setError(apiErrorMessage(leadResult.reason, "Could not load assistance requests"));
    if (vendorResult.status === "fulfilled") setVendors(Array.isArray(vendorResult.value.data) ? vendorResult.value.data : vendorResult.value.data?.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => filter ? leads.filter(item => item.status === filter) : leads, [leads, filter]);
  const activeCount = leads.filter(item => ["new", "contacted", "in_progress"].includes(item.status)).length;

  const updateLead = async id => {
    setSaving(`lead-${id}`);
    try { await adminAPI.updateAssistanceLead(id, drafts[id]); await load(); toast.success("Assistance request updated and audited"); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not update assistance request")); }
    finally { setSaving(""); }
  };
  const issueVci = async event => {
    event.preventDefault();
    if (!vci.vendor_id) { toast.error("Choose a verified vendor"); return; }
    setSaving("vci");
    try {
      await adminAPI.issueVciCredential(vci.vendor_id, { ...vci, composite_score: Number(vci.composite_score), issued_at: new Date(`${vci.issued_at}T00:00:00Z`).toISOString(), expires_at: new Date(`${vci.expires_at}T23:59:59Z`).toISOString() });
      toast.success("VCI credential issued and previous current credential superseded");
      setVci(current => ({ ...current, source_assessment_ref: "", composite_score: "", maturity_band: "", tier1_passed: false }));
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not issue VCI credential")); }
    finally { setSaving(""); }
  };

  if (loading) return <div className="workspace-loading"><i className="page-spinner" /><b>Loading marketplace operations...</b></div>;
  return <div className="admin-operations">
    <header className="workspace-heading"><div><span>MARKETPLACE CONTROL</span><h1>Vendor operations</h1><p>Resolve onboarding help and connect reviewed VCI credentials without mixing them with ESG.</p></div><div className="workspace-summary"><strong>{activeCount}</strong><small>active help requests</small></div></header>
    {error && <div className="workspace-error"><b>Some operations could not load</b><p>{error}</p><button onClick={load}>Retry</button></div>}
    <section className="operations-panel"><header><div><span>ASSISTANCE QUEUE</span><h2>Vendor help requests</h2></div><select value={filter} onChange={event => setFilter(event.target.value)}><option value="">All statuses</option>{ASSISTANCE_STATUSES.map(status => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></header>{visible.length ? <div className="operations-leads">{visible.map(item => <article key={item.id}><div className="operation-lead-head"><div><span>{item.topic.replaceAll("_", " ")}</span><h3>{item.organization_name}</h3><small>{item.contact_name} · {item.contact_email}{item.phone ? ` · ${item.phone}` : ""}</small></div><b className={`workspace-status ${item.status === "resolved" ? "verified" : ""}`}>{item.status.replaceAll("_", " ")}</b></div><p>{item.note || "No additional note supplied."}</p><div className="operations-edit-grid"><label><span>Status</span><select value={drafts[item.id]?.status || item.status} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], status: event.target.value } }))}>{ASSISTANCE_STATUSES.map(status => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label><span>Assignee</span><input value={drafts[item.id]?.assignee || ""} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], assignee: event.target.value } }))} placeholder="Team member" /></label><label className="wide"><span>Private operations note</span><textarea rows={2} value={drafts[item.id]?.admin_notes || ""} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], admin_notes: event.target.value } }))} placeholder="Next action or call outcome" /></label><button disabled={saving === `lead-${item.id}`} onClick={() => updateLead(item.id)}>{saving === `lead-${item.id}` ? "Saving..." : "Save update"}</button></div></article>)}</div> : <div className="workspace-empty"><b>No assistance requests in this view</b><p>New vendor requests will appear here with their consented contact details.</p></div>}</section>
    <section className="operations-panel vci-operations"><header><div><span>REVIEWED CREDENTIAL</span><h2>Issue VCI credential</h2><p>Only enter a result supported by the named assessment source. This action is audited.</p></div><a href="https://even-procurement-advisory.vercel.app/dashboard" target="_blank" rel="noreferrer">Open VCI assessment</a></header><form onSubmit={issueVci}><label className="wide"><span>Verified vendor</span><select required value={vci.vendor_id} onChange={event => setVci(current => ({ ...current, vendor_id: event.target.value }))}><option value="">Select vendor</option>{vendors.map(vendor => <option key={vendor.id || vendor.vendor_id} value={vendor.id || vendor.vendor_id}>{vendor.organization_name || vendor.name}</option>)}</select></label><label><span>Framework version</span><input required value={vci.framework_version} onChange={event => setVci(current => ({ ...current, framework_version: event.target.value }))} /></label><label><span>Source assessment reference</span><input required value={vci.source_assessment_ref} onChange={event => setVci(current => ({ ...current, source_assessment_ref: event.target.value }))} placeholder="Assessment ID or reviewed URL" /></label><label><span>Composite score</span><input required type="number" min="0" max="100" step="0.1" value={vci.composite_score} onChange={event => setVci(current => ({ ...current, composite_score: event.target.value }))} /></label><label><span>Maturity band</span><input required value={vci.maturity_band} onChange={event => setVci(current => ({ ...current, maturity_band: event.target.value }))} placeholder="e.g. Established" /></label><label><span>Issue date</span><input required type="date" value={vci.issued_at} onChange={event => setVci(current => ({ ...current, issued_at: event.target.value }))} /></label><label><span>Expiry date</span><input required type="date" value={vci.expires_at} onChange={event => setVci(current => ({ ...current, expires_at: event.target.value }))} /></label><label className="check"><input type="checkbox" checked={vci.tier1_passed} onChange={event => setVci(current => ({ ...current, tier1_passed: event.target.checked }))} /><span>Tier 1 gate passed</span></label><label className="check"><input type="checkbox" checked={vci.public_visible} onChange={event => setVci(current => ({ ...current, public_visible: event.target.checked }))} /><span>Visible on public vendor profile</span></label><button className="wide" disabled={saving === "vci"}>{saving === "vci" ? "Issuing credential..." : "Review and issue credential"}</button></form></section>
  </div>;
}
