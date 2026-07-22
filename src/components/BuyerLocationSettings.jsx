import { useEffect, useState } from "react";
import { apiErrorMessage, buyerAPI } from "../api/api";
import LocationAutocomplete from "./LocationAutocomplete";

const emptyAddress = { label: "Office", contact_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", location_key: "", country: "India", is_default: false };

function Title({ eyebrow, children, action }) {
  return <div className="account-title"><div><span>{eyebrow}</span><h1>{children}</h1></div>{action}</div>;
}
function Loading({ label }) {
  return <div className="account-loading"><i className="page-spinner" /><b>{label}</b><small>Your data is safe while this loads.</small></div>;
}
function ErrorState({ message, retry }) {
  return <div className="account-error"><b>Something went wrong</b><p>{message}</p><button onClick={retry}>Try again</button></div>;
}

export function BuyerProfileSettings({ toast }) {
  const [form, setForm] = useState({ organization_name: "", company_type: "", sector: "", annual_procurement_budget_band: "", preferred_vendor_categories: "", phone: "", website: "", location: "", location_key: "" });
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setStatus({ loading: true, error: "" });
    try {
      const response = await buyerAPI.getMyProfile();
      setForm(current => ({ ...current, ...(response.data || {}) }));
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: apiErrorMessage(error, "Could not load your profile") });
    }
  };
  useEffect(() => { load(); }, []);
  const save = async event => {
    event.preventDefault();
    if (form.location && !form.location_key) { toast.error("Choose your service region from the recommendations"); return; }
    setSaving(true);
    try { await buyerAPI.updateProfile(form); toast.success("Buyer profile saved"); }
    catch (error) { toast.error(apiErrorMessage(error, "Could not save profile")); }
    finally { setSaving(false); }
  };
  if (status.loading) return <Loading label="Loading your profile..." />;
  if (status.error) return <ErrorState message={status.error} retry={load} />;
  const fields = [["organization_name", "Organisation name"], ["company_type", "Company type"], ["sector", "Sector"], ["annual_procurement_budget_band", "Annual procurement budget"], ["preferred_vendor_categories", "Preferred vendor categories"], ["phone", "Contact number"], ["website", "Website"]];
  return <><Title eyebrow="ACCOUNT SETTINGS">Buyer profile</Title><p className="account-intro">These details help prefill requirements and suggest relevant service regions. Nothing here is published as a vendor listing.</p><form className="account-form" onSubmit={save}>{fields.map(([key, label]) => <label key={key}><span>{label}</span><input value={form[key] || ""} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} /></label>)}<LocationAutocomplete className="wide" value={form.location || ""} selectedKey={form.location_key || ""} label="Primary service region" onSelect={item => setForm(current => ({ ...current, location: item.profile_location, location_key: item.key }))} onClear={() => setForm(current => ({ ...current, location_key: "" }))} /><button className="primary-action" disabled={saving || (!!form.location && !form.location_key)}>{saving ? "Saving profile..." : "Save profile"}</button></form></>;
}

export function BuyerAddresses({ toast }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const load = async () => {
    setStatus(current => ({ ...current, loading: true, error: "" }));
    try { const response = await buyerAPI.addresses(); setItems(response.data || []); setStatus({ loading: false, error: "" }); }
    catch (error) { setStatus({ loading: false, error: apiErrorMessage(error, "Could not load saved addresses") }); }
  };
  useEffect(() => { load(); }, []);
  const save = async event => {
    event.preventDefault();
    if (!form.location_key) { toast.error("Choose a recommended city, state and PIN"); return; }
    setSaving(true);
    try { await buyerAPI.addAddress(form); setForm(null); await load(); toast.success("Address saved"); }
    catch (error) { toast.error(apiErrorMessage(error, "Could not save address")); }
    finally { setSaving(false); }
  };
  const act = async (id, action, success, fallback) => {
    setActingId(id);
    try { await action(); await load(); toast.success(success); }
    catch (error) { toast.error(apiErrorMessage(error, fallback)); }
    finally { setActingId(null); }
  };
  if (status.loading && !items.length) return <Loading label="Loading saved addresses..." />;
  if (status.error) return <ErrorState message={status.error} retry={load} />;
  return <><Title eyebrow="CONTACT & LOCATION" action={<button className="primary-action" onClick={() => setForm({ ...emptyAddress })}>Add address</button>}>Saved addresses</Title><p className="account-intro">Use validated postal locations to prevent city, state, and PIN mismatches in requirements.</p>{form && <form className="account-form address-form" onSubmit={save}><label><span>Address label</span><input required value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value }))} /></label><label><span>Contact name</span><input required value={form.contact_name} onChange={event => setForm(current => ({ ...current, contact_name: event.target.value }))} /></label><label><span>Phone</span><input required inputMode="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></label><label className="wide"><span>Building, street or office</span><input required value={form.line1} onChange={event => setForm(current => ({ ...current, line1: event.target.value }))} /></label><label className="wide"><span>Landmark or area (optional)</span><input value={form.line2} onChange={event => setForm(current => ({ ...current, line2: event.target.value }))} /></label><LocationAutocomplete className="wide" value={form.location_key ? `${form.city}, ${form.state}` : ""} selectedKey={form.location_key} label="Postal location" required onSelect={item => setForm(current => ({ ...current, city: item.city, state: item.state, postal_code: item.postal_code, country: item.country, location_key: item.key }))} onClear={() => setForm(current => ({ ...current, city: "", state: "", postal_code: "", location_key: "" }))} /><div className="address-location-grid"><label><span>City</span><input readOnly value={form.city} /></label><label><span>State</span><input readOnly value={form.state} /></label><label><span>PIN code</span><input readOnly value={form.postal_code} /></label></div><label className="checkbox-field"><input type="checkbox" checked={form.is_default} onChange={event => setForm(current => ({ ...current, is_default: event.target.checked }))} /><span>Use as default procurement address</span></label><div className="form-actions"><button type="button" onClick={() => setForm(null)}>Cancel</button><button className="primary-action" disabled={saving || !form.location_key}>{saving ? "Saving..." : "Save address"}</button></div></form>}<div className="address-grid">{items.map(item => <article key={item.id}><div><b>{item.label}</b>{item.is_default && <span>Default</span>}</div><strong>{item.contact_name}</strong><p>{item.line1}{item.line2 ? `, ${item.line2}` : ""}<br />{item.city}, {item.state} {item.postal_code}<br />{item.phone}</p><footer>{!item.is_default && <button disabled={actingId === item.id} onClick={() => act(item.id, () => buyerAPI.defaultAddress(item.id), "Default address updated", "Could not update default address")}>Make default</button>}<button disabled={actingId === item.id} onClick={() => act(item.id, () => buyerAPI.deleteAddress(item.id), "Address removed", "Could not remove address")}>{actingId === item.id ? "Working..." : "Remove"}</button></footer></article>)}{!items.length && !form && <div className="account-empty">No saved addresses yet.</div>}</div></>;
}
