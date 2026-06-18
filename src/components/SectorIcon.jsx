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

export default function SectorIcon({ iconKey, name, size=28, color="currentColor" }) {
  const key = ICON_PATHS[iconKey] ? iconKey : sectorIconKey(name);
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON_PATHS[key]}</svg>;
}
