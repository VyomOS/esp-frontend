import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectorIcon from "../components/SectorIcon";
import { marketplaceAPI, resolveMediaUrl } from "../api/api";

const CATEGORIES = [
  { label:"All services", key:"all", icon:"technology", tone:"violet" },
  { label:"Logistics", key:"Logistics & Delivery", icon:"automotive", tone:"orange" },
  { label:"Food & catering", key:"Food & Catering", icon:"food", tone:"green" },
  { label:"Corporate gifts", key:"Handicrafts & Artisan", icon:"gifting", tone:"pink" },
  { label:"Healthcare", key:"Healthcare & Wellness", icon:"healthcare", tone:"blue" },
  { label:"IT services", key:"IT & Digital Services", icon:"technology", tone:"violet" },
];

const categoryStyle = (name="") => {
  const match = CATEGORIES.find(item=>item.key===name);
  return match || { icon:"generic", tone:"violet" };
};

const money = (value, currency="INR") => value == null ? "" : new Intl.NumberFormat("en-IN", { style:"currency", currency, maximumFractionDigits:value % 1 ? 2 : 0 }).format(value);
const servicePrice = service => service.offer_active
  ? { current:money(service.offer_price, service.currency), original:money(service.base_price, service.currency), label:`${service.discount_percent}% off` }
  : service.base_price != null
    ? { current:money(service.base_price, service.currency), original:"", label:service.pricing_type === "starting_at" ? "Starting at" : "Vendor price" }
    : { current:service.price_range || "Request a quote", original:"", label:service.price_range ? "Vendor rate" : "Pricing" };

function Logo() {
  return <div className="market-logo" aria-label="Even Procurement">
    <span className="market-logo-mark"><span>e</span></span>
    <span><strong>even</strong><small>PROCUREMENT</small></span>
  </div>;
}

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [services, setServices] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offerIndex, setOfferIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadServices = () => {
    setLoading(true); setLoadError(false);
    Promise.all([marketplaceAPI.listServices({ page_size:24, sort:"demand" }), marketplaceAPI.listServices({ page_size:8, sort:"offers" })])
      .then(([catalogue, featured])=>{ setServices(catalogue.data?.items || []); setOffers((featured.data?.items || []).filter(item=>item.offer_active)); })
      .catch(()=>setLoadError(true))
      .finally(()=>setLoading(false));
  };
  useEffect(loadServices, []);
  useEffect(()=>{ if(offers.length<2)return; const timer=setInterval(()=>setOfferIndex(index=>(index+1)%offers.length),5000); return()=>clearInterval(timer); },[offers.length]);
  const featured = offers[offerIndex] || services[0];

  const visible = useMemo(() => services.filter(service => {
    const matchesCategory = category === "all" || service.category === category;
    const haystack = `${service.title} ${service.vendor?.organization_name || ""} ${service.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [category, query, services]);

  const openService = (service) => {
    const intent = { version:1, service_id:service.id, vendor_id:service.vendor?.id, title:service.title, category:service.category, created_at:Date.now() };
    sessionStorage.setItem("espServiceIntent", JSON.stringify(intent));
    sessionStorage.setItem("buyerProcurementQuery", service.title);
    sessionStorage.setItem("buyerProcurementCategory", service.category || "");
    if (localStorage.getItem("token")) navigate("/dashboard/vendors");
    else navigate(`/register?role=buyer&service=${service.id}`);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    sessionStorage.setItem("buyerProcurementQuery", clean);
    if (category !== "all") sessionStorage.setItem("buyerProcurementCategory", category);
    if (localStorage.getItem("token")) navigate("/dashboard/vendors");
    else navigate(`/register?role=buyer&service=${encodeURIComponent(clean)}`);
  };

  return <div className="market-page">
    <header className="market-header">
      <div className="market-header-inner">
        <button className="logo-button" onClick={()=>navigate("/")}><Logo/></button>
        <nav className="market-nav" aria-label="Primary navigation">
          <a href="#services">Services</a>
          <a href="#demand">In demand</a>
          <button onClick={()=>navigate("/register?role=buyer")}>For buyers</button>
        </nav>
        <div className="market-actions">
          <button className="sign-in-link" onClick={()=>navigate("/signin")}>Sign in</button>
          <button className="vendor-cta" onClick={()=>navigate("/register?role=vendor")}>Register as a vendor <span>↗</span></button>
        </div>
      </div>
    </header>

    <main>
      <section className="market-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span/>India's responsible services marketplace</div>
          <h1>Business services,<br/><em>ready when you are.</em></h1>
          <p>Compare prices, choose verified vendors and start a conversation in minutes. Every supplier is ESG-scored and ready for business.</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What service does your business need?" aria-label="Search services"/>
            <button type="submit">Find services</button>
          </form>
          <div className="hero-trust"><span>✓ Browse before signing up</span><span>✓ Vendor-published rates</span><span>✓ ESG context where available</span></div>
        </div>
        <div className="hero-art" aria-label="Service marketplace preview">
          <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
          {featured ? <div className="hero-card hero-card-main" key={featured.id}>
            <div className="mini-tag">{featured.offer_active ? `${featured.discount_percent}% OFF NOW` : featured.demand_count_30d ? "IN DEMAND" : "JUST ADDED"}</div>
            <div className={`service-visual tone-${categoryStyle(featured.category).tone}`}>{featured.image_url ? <img src={resolveMediaUrl(featured.image_url)} alt=""/> : <div className="photo-pending">Photo coming soon</div>}</div>
            <div><small>{featured.category || "BUSINESS SERVICE"}</small><strong>{featured.title}</strong><span>{servicePrice(featured).current}{featured.unit ? ` · ${featured.unit}` : ""}</span></div>
            <button onClick={()=>openService(featured)}>Request service</button>
          </div> : <div className="hero-card hero-card-main"><div className="service-visual tone-violet"><SectorIcon iconKey="technology" size={56}/></div><div><small>SERVICE MARKETPLACE</small><strong>{loading ? "Loading services…" : "Tell us what you need"}</strong><span>Connect with a relevant vendor</span></div></div>}
          <div className="floating-pill pill-one"><span className="pulse"/> Public service discovery</div>
          <div className="hero-stamp">ETHICAL<br/><b>SOURCING</b></div>
        </div>
      </section>

      <section className="category-section" aria-label="Service categories">
        <div className="category-row">
          {CATEGORIES.map(item => <button key={item.key} className={category===item.key?"active":""} onClick={()=>setCategory(item.key)}>
            <span className={`category-icon tone-${item.tone}`}><SectorIcon iconKey={item.icon} size={30}/></span>
            <span>{item.label}</span>
          </button>)}
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading"><div><span className="eyebrow-commerce">SERVICES FOR YOUR BUSINESS</span><h2>Explore the marketplace</h2><p>Service details and rates are published by vendors.</p></div><button onClick={()=>{setCategory("all");setQuery("")}}>View all services <span>→</span></button></div>
        <div className="service-grid">
          {loading && [...Array(6)].map((_,i)=><div className="service-card skeleton" style={{height:430}} key={i}/>)}
          {!loading && visible.map(service => { const style=categoryStyle(service.category); const verified=service.vendor?.verification_status==="verified"; const price=servicePrice(service); return <article className="service-card" key={service.id}>
            <div className={`service-card-art tone-${style.tone}`}>
              {service.offer_active ? <span className="service-badge offer-badge">{service.discount_percent}% off</span> : verified && <span className="service-badge">Verified vendor</span>}
              {service.image_url ? <img src={resolveMediaUrl(service.image_url)} alt={`${service.title} by ${service.vendor?.organization_name || "vendor"}`} loading="lazy"/> : <div className="photo-pending">Vendor photo pending</div>}
            </div>
            <div className="service-card-body">
              <span className="service-category">{service.category}</span>
              <h3>{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <div className="vendor-line"><span className="vendor-avatar">{service.vendor?.organization_name?.[0] || "V"}</span><span>{service.vendor?.organization_name || "Service provider"}</span>{verified && <b>✓</b>}</div>
              {(service.vendor?.total_reviews>0 || service.vendor?.location) && <div className="rating-line">{service.vendor?.total_reviews>0 && <span>★ {service.vendor.average_rating} · {service.vendor.total_reviews} reviews</span>}{service.vendor?.location && <span>{service.vendor.location}</span>}</div>}
              <div className="price-row"><div><small>{price.label}</small><strong>{price.current}</strong>{service.unit && <span>per {service.unit}</span>}{price.original && <del>{price.original}</del>}</div><button onClick={()=>openService(service)}>Request service</button></div>
            </div>
          </article>})}
        </div>
        {!loading && loadError && <div className="market-empty"><strong>Services could not be loaded</strong><p>The marketplace connection may be waking up. Please try again.</p><button onClick={loadServices}>Retry</button></div>}
        {!loading && !loadError && visible.length===0 && <div className="market-empty"><strong>No exact match yet</strong><p>Try another service or browse all categories.</p><button onClick={()=>{setQuery("");setCategory("all")}}>Reset search</button></div>}
      </section>

      <section className="demand-section" id="demand"><div className="demand-intro"><span className="eyebrow-commerce light">BUILT FOR PROCUREMENT</span><h2>From discovery to a clear requirement</h2><p>Browse service catalogues publicly, then create a buyer account only when you are ready to contact a vendor.</p></div><div className="demand-list">{[{label:"Browse services",sub:"No account required",icon:"search",tone:"green"},{label:"Compare vendor context",sub:"Rates, location and trust signals",icon:"check",tone:"blue"},{label:"Send your requirement",sub:"Continue through the existing RFP workflow",icon:"clipboard",tone:"orange"}].map((item,i)=><div className="demand-flow" key={item.label}><span className={`demand-number tone-${item.tone}`}>0{i+1}</span><span className={`demand-icon tone-${item.tone}`}><SectorIcon iconKey={item.icon} size={34}/></span><span className="demand-name">{item.label}<small>{item.sub}</small></span></div>)}</div></section>

      <section className="vendor-banner">
        <div><span>FOR SERVICE PROVIDERS</span><h2>Good work deserves<br/>better business.</h2><p>Join verified vendors already receiving requirements from serious corporate buyers.</p><button onClick={()=>navigate("/register?role=vendor")}>Build your vendor storefront <span>→</span></button></div>
        <div className="vendor-metrics"><div><strong>01</strong><span>create your profile</span></div><div><strong>02</strong><span>publish services</span></div><div><strong>03</strong><span>respond to buyers</span></div></div>
      </section>
    </main>
    <footer className="market-footer"><Logo/><span>Responsible procurement, made practical.</span><span>© 2026 Even Procurement</span></footer>
  </div>;
}
