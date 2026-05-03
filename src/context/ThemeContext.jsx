import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  { id: "evencargo", label: "Evencargo",   preview: ["#f7f9fc", "#ff6b35", "#2ecc71"] },
  { id: "dark",      label: "Dark Navy",   preview: ["#0a0f1e", "#6384ff", "#34d399"] },
  { id: "ocean",     label: "Ocean",       preview: ["#0a1628", "#38bdf8", "#34d399"] },
  { id: "forest",    label: "Forest",      preview: ["#0a1a0f", "#34d399", "#38bdf8"] },
  { id: "sunset",    label: "Sunset",      preview: ["#1a0a0f", "#fb7185", "#f97316"] },
  { id: "purple",    label: "Purple",      preview: ["#0f0a1e", "#a78bfa", "#818cf8"] },
  { id: "slate",     label: "Slate",       preview: ["#0f1117", "#58a6ff", "#3fb950"] },
  { id: "crimson",   label: "Crimson",     preview: ["#0f0505", "#ef4444", "#f97316"] },
  { id: "amber",     label: "Amber",       preview: ["#0f0a00", "#fbbf24", "#f97316"] },
  { id: "mint",      label: "Mint",        preview: ["#00100a", "#10b981", "#06b6d4"] },
  { id: "rose",      label: "Rose",        preview: ["#0f0008", "#f472b6", "#e879f9"] },
  { id: "cyber",     label: "Cyber",       preview: ["#000a0f", "#00e5ff", "#00ff9f"] },
  { id: "neon",      label: "Neon",        preview: ["#050008", "#b700ff", "#ff0099"] },
  { id: "gold",      label: "Gold",        preview: ["#0a0800", "#d4af37", "#f5c842"] },
  { id: "arctic",    label: "Arctic",      preview: ["#f0f8ff", "#0284c7", "#7c3aed"] },
  { id: "midnight",  label: "Midnight",    preview: ["#000000", "#ffffff", "#34d399"] },
  { id: "sakura",    label: "Sakura",      preview: ["#fff5f7", "#ec4899", "#10b981"] },
  { id: "light",     label: "Light",       preview: ["#f8fafc", "#6384ff", "#059669"] },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("esp-theme") || "evencargo");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "" : theme);
    localStorage.setItem("esp-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
