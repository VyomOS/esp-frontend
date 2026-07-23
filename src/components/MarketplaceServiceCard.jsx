import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buyerAPI, resolveMediaUrl } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const money = (value, currency = "INR") => value == null ? "" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
export const servicePrice = service => service.offer_active ? { current: money(service.offer_price, service.currency), original: money(service.base_price, service.currency), label: `${service.discount_percent}% off` } : service.base_price != null ? { current: money(service.base_price, service.currency), original: "", label: service.pricing_type === "starting_at" ? "Starting at" : "Vendor price" } : { current: service.price_range || "Request a quote", original: "", label: service.price_range ? "Vendor rate" : "Pricing" };

export default function MarketplaceServiceCard({ service, saved = false, onSaved }) {
  const navigate = useNavigate(); const location = useLocation(); const { user } = useAuth(); const toast = useToast(); const price = servicePrice(service);
  const [isSaved, setIsSaved] = useState(saved); const [saving, setSaving] = useState(false); const [cooldown, setCooldown] = useState(false); const timer = useRef();
  useEffect(() => setIsSaved(saved), [saved]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const toggleSaved = async event => {
    event.stopPropagation();
    if (!user) { sessionStorage.setItem("espReturnTo", location.pathname + location.search); navigate("/signin"); return; }
    if (user.role !== "buyer" || saving || cooldown) return;
    const next = !isSaved; setSaving(true);
    try {
      if (next) await buyerAPI.save({ target_type: "service", target_id: service.id }); else await buyerAPI.unsave("service", service.id);
      setIsSaved(next); onSaved?.(next); toast.success(next ? "Service saved to your account" : "Service removed from saved items");
      setCooldown(true); timer.current = setTimeout(() => setCooldown(false), 2000);
    } catch (error) { toast.error(error.response?.data?.detail || "Could not update saved services"); }
    finally { setSaving(false); }
  };
  return <article className="service-card" onClick={() => navigate(`/services/${service.id}`)}>
    <div className="service-card-art">
      {service.offer_active ? <span className="service-badge offer-badge">{service.discount_percent}% off</span> : service.vendor?.verification_status === "verified" && <span className="service-badge">Verified vendor</span>}
      {user?.role === "buyer" && <button disabled={saving || cooldown} className={`save-service ${isSaved ? "saved" : ""} ${saving ? "saving" : ""}`} onClick={toggleSaved} aria-label={saving ? "Updating saved service" : isSaved ? "Remove from saved" : "Save service"}>{saving ? <i className="button-spinner" /> : isSaved ? "♥" : "♡"}</button>}
      {service.image_url ? <img src={resolveMediaUrl(service.image_url)} alt={`${service.title} catalogue`} loading="lazy" /> : <div className="catalogue-placeholder"><span>e</span><b>Image being prepared</b></div>}
    </div>
    <div className="service-card-body">
      <span className="service-category">{service.category}</span><h3>{service.title}</h3><p className="service-description">{service.description}</p>
      <div className="vendor-line"><span className="vendor-avatar">{service.vendor?.organization_name?.[0] || "V"}</span><span>{service.vendor?.organization_name || "Service provider"}</span>{service.vendor?.verification_status === "verified" && <b>✓</b>}</div>
      {service.vendor?.location && <div className="rating-line"><span>{service.vendor.location}</span></div>}
      <div className="price-row"><div><small>{price.label}</small><strong>{price.current}</strong>{service.unit && <span>per {service.unit}</span>}{price.original && <del>{price.original}</del>}</div><button onClick={event => { event.stopPropagation(); navigate(`/services/${service.id}`); }}>View service</button></div>
    </div>
  </article>;
}
