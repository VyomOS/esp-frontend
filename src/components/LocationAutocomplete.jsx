import { useEffect, useRef, useState } from "react";
import { apiErrorMessage, buyerAPI } from "../api/api";

export default function LocationAutocomplete({ value = "", selectedKey = "", onSelect, onClear, label = "City, state or PIN", placeholder = "Start typing a city or 6-digit PIN", required = false, className = "" }) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const requestId = useRef(0);

  useEffect(() => setQuery(value || ""), [value]);
  useEffect(() => {
    if (!open) return undefined;
    const currentRequest = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await buyerAPI.locationSuggestions(query.trim(), 8);
        if (currentRequest === requestId.current) {
          setItems(response.data?.items || []);
          setActive(-1);
        }
      } catch (requestError) {
        if (currentRequest === requestId.current) setError(apiErrorMessage(requestError, "Could not load recommended locations"));
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, query.trim() ? 220 : 0);
    return () => clearTimeout(timer);
  }, [query, open]);

  const choose = item => {
    setQuery(item.profile_location);
    setOpen(false);
    setActive(-1);
    onSelect(item);
  };
  const change = event => {
    setQuery(event.target.value);
    if (selectedKey) onClear?.();
    setOpen(true);
  };
  const keyDown = event => {
    if (!open && event.key === "ArrowDown") { setOpen(true); return; }
    if (event.key === "Escape") { setOpen(false); return; }
    if (!items.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => Math.min(items.length - 1, index + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => Math.max(0, index - 1)); }
    if (event.key === "Enter" && active >= 0) { event.preventDefault(); choose(items[active]); }
  };

  return <label className={`location-picker ${className}`}>
    <span>{label}</span>
    <div className={`location-picker-input ${selectedKey ? "selected" : ""}`}>
      <input value={query} onChange={change} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={keyDown} placeholder={placeholder} required={required} role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="postal-location-options" />
      {selectedKey && <b aria-label="Validated postal location">Verified</b>}
    </div>
    {open && <div className="location-picker-menu" id="postal-location-options" role="listbox">
      {loading && <div className="location-picker-status">Finding postal locations...</div>}
      {!loading && error && <div className="location-picker-status error">{error}</div>}
      {!loading && !error && items.map((item, index) => <button type="button" role="option" aria-selected={active === index} className={active === index ? "active" : ""} key={item.key} onMouseDown={() => choose(item)}>
        <span><strong>{item.area}</strong><small>{item.city} · {item.district}, {item.state}</small></span><em>{item.postal_code}</em>
      </button>)}
      {!loading && !error && !items.length && <div className="location-picker-status">No supported postal location found. Try a major city or PIN.</div>}
      <footer>India Post directory-backed locations</footer>
    </div>}
  </label>;
}
