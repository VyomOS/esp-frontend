const ICON_PATHS = {
  healthcare: <><path d="M12 3v18M3 12h18"/><path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></>,
  automotive: <><path d="M5 16h14l-1.5-6h-11L5 16Z"/><path d="M3 16v3h3m12 0h3v-3M7 19v2m10-2v2"/></>,
  technology: <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8m-4-4v4M8 9l-2 2 2 2m8-4 2 2-2 2"/></>,
  gifting: <><rect x="4" y="9" width="16" height="12" rx="1"/><path d="M3 6h18v4H3zM12 6v15M8 6c-3 0-3-4 0-4 2 0 4 4 4 4m4 0c3 0 3-4 0-4-2 0-4 4-4 4"/></>,
  food: <><path d="M4 3v8a3 3 0 0 0 3 3V3m-3 5h3m0 6v7M15 3v18m0-18c4 1 5 4 5 8h-5"/></>,
  logistics: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  facilities: <><path d="M4 20h16M7 20V8h10v12M9 8V4h6v4M10 12h4m-4 4h4"/></>,
  staffing: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7m0-5c3 0 5 2 5 5"/></>,
  textiles: <><path d="M8 4 3 8l3 5 3-2v10h6V11l3 2 3-5-5-4c-1 2-2 3-4 3S9 6 8 4Z"/></>,
  sustainability: <><path d="M20 4C10 4 5 9 5 16c5 1 12-1 15-12Z"/><path d="M4 21c3-6 7-9 13-13"/></>,
  artisan: <><path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z"/></>,
  construction: <><path d="M4 21V7h10v14M14 11h6v10M7 10h4m-4 4h4m-4 4h4m10-4h2m-2 4h2"/></>,
  generic: <><circle cx="12" cy="12" r="9"/><path d="M8 12h8m-4-4v8"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h4"/></>,
  check: <><path d="m4 12 5 5L20 6"/><path d="M20 12a8 8 0 1 1-4-7.3"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4.4 3.3-7 8-7s7.4 2.6 8 7"/></>,
  users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6m0-5c3 0 5 1.8 5 5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  chart: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/></>,
  leaf: <><path d="M20 4C10 4 5 9 5 16c5 1 12-1 15-12Z"/><path d="M4 21c3-6 7-9 13-13"/></>,
  document: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6m-6 4h6"/></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
  warning: <><path d="M12 3 2.5 20h19z"/><path d="M12 9v5m0 3v.1"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  key: <><circle cx="8" cy="12" r="4"/><path d="M12 12h9m-3 0v3m-3-3v2"/></>,
};

export function sectorIconKey(name="") {
  const value = ` ${name.toLowerCase()} `;
  const rules = [
    ["healthcare",["health","hospital","medical","clinic","wellness","pharma"]],
    ["automotive",["auto","vehicle","fleet","mobility"]],
    ["technology",["technology","software","digital"," it ","computer","data"]],
    ["gifting",["gift","hamper","merchandise"]], ["food",["food","cater","meal","beverage"]],
    ["logistics",["logistic","delivery","transport","courier"]], ["facilities",["facility","clean","housekeep"]],
    ["staffing",["staff","training","recruit"]], ["textiles",["textile","apparel","uniform","fabric"]],
    ["sustainability",["green","sustain","renewable","recycl"]], ["artisan",["artisan","handicraft","craft"]],
    ["construction",["construction","fitout","interior","building"]],
  ];
  return rules.find(([,words])=>words.some(word=>value.includes(word)))?.[0] || "generic";
}

export default function SectorIcon({ iconKey, name, size=28, color="currentColor", label }) {
  const key = ICON_PATHS[iconKey] ? iconKey : sectorIconKey(name);
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label?undefined:"true"} role={label?"img":undefined}>{label && <title>{label}</title>}{ICON_PATHS[key]}</svg>;
}
