import { createContext, useContext, useState, useEffect } from "react";

// ─── Palette ────────────────────────────────────────────────────────────────

export const palette = {
  // Brand – Warm Rose
  roseLight:    "#F5E8ED",
  rose:         "#D4739A",
  roseMid:      "#B4547A",
  roseDark:     "#9A4468",
  roseDeep:     "#7A3452",

  // Warm Neutrals (Light mode)
  warmWhite:    "#FAFAFA",
  warmCream:    "#F5F0EE",
  warmStone:    "#EBE5E2",

  // Text Neutrals
  warmGray:     "#9A9590",
  warmDark:     "#5A5550",
  nearBlack:    "#1A1A1A",

  // Accent
  gold:         "#C9943A",
  goldLight:    "#F5E8D0",

  // Semantic
  success:      "#2D8A5E",
  successLight: "#D6F0E5",
  error:        "#C0392B",
  errorLight:   "#FADED9",
};

// ─── Token maps (light / dark) ───────────────────────────────────────────────

const tokens = {
  light: {
    // Backgrounds
    bgPage:         palette.warmWhite,
    bgSurface:      "#FFFFFF",
    bgSubtle:       palette.warmCream,
    bgMuted:        palette.warmStone,

    // Brand fills
    bgBrand:        palette.roseMid,
    bgBrandHover:   palette.roseDark,
    bgBrandSubtle:  palette.roseLight,

    // Text
    textPrimary:    palette.nearBlack,
    textSecondary:  palette.warmDark,
    textTertiary:   palette.warmGray,
    textOnBrand:    "#FFFFFF",
    textBrand:      palette.roseMid,
    textBrandDark:  palette.roseDark,

    // Borders
    borderDefault:  "#E8E3E0",
    borderBrand:    palette.rose,
    borderStrong:   palette.roseMid,

    // Accents
    gold:           palette.gold,
    goldBg:         palette.goldLight,

    // Semantic
    success:        palette.success,
    successBg:      palette.successLight,
    error:          palette.error,
    errorBg:        palette.errorLight,
  },
  dark: {
    // Backgrounds
    bgPage:         "#121212",
    bgSurface:      "#1E1E1E",
    bgSubtle:       "#252525",
    bgMuted:        "#2E2E2E",

    // Brand fills
    bgBrand:        palette.rose,
    bgBrandHover:   "#E088AD",
    bgBrandSubtle:  "#2A1A22",

    // Text
    textPrimary:    "#F0EDEB",
    textSecondary:  "#B0AAA5",
    textTertiary:   "#787270",
    textOnBrand:    "#FFFFFF",
    textBrand:      "#D4739A",
    textBrandDark:  palette.rose,

    // Borders
    borderDefault:  "#333333",
    borderBrand:    palette.roseDark,
    borderStrong:   palette.rose,

    // Accents
    gold:           "#E0AD56",
    goldBg:         "#2E220F",

    // Semantic
    success:        "#3DAD78",
    successBg:      "#0F2D1E",
    error:          "#E05252",
    errorBg:        "#2D0F0F",
  },
};

// ─── Tailwind-compatible CSS variable injection ───────────────────────────────

function injectCSSVars(mode) {
  const t = tokens[mode];
  const root = document.documentElement;

  // Map each token to a CSS custom property
  const vars = {
    "--color-bg-page":          t.bgPage,
    "--color-bg-surface":       t.bgSurface,
    "--color-bg-subtle":        t.bgSubtle,
    "--color-bg-muted":         t.bgMuted,
    "--color-bg-brand":         t.bgBrand,
    "--color-bg-brand-hover":   t.bgBrandHover,
    "--color-bg-brand-subtle":  t.bgBrandSubtle,

    "--color-text-primary":     t.textPrimary,
    "--color-text-secondary":   t.textSecondary,
    "--color-text-tertiary":    t.textTertiary,
    "--color-text-on-brand":    t.textOnBrand,
    "--color-text-brand":       t.textBrand,
    "--color-text-brand-dark":  t.textBrandDark,

    "--color-border-default":   t.borderDefault,
    "--color-border-brand":     t.borderBrand,
    "--color-border-strong":    t.borderStrong,

    "--color-gold":             t.gold,
    "--color-gold-bg":          t.goldBg,

    "--color-success":          t.success,
    "--color-success-bg":       t.successBg,
    "--color-error":            t.error,
    "--color-error-bg":         t.errorBg,
  };

  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Toggle Tailwind dark class on <html>
  root.classList.toggle("dark", mode === "dark");
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export function ThemeProvider({ children, defaultMode = "light" }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return defaultMode;
    return localStorage.getItem("theme-mode") || "light";
  });

  // Apply CSS variables whenever mode changes
  useEffect(() => {
    injectCSSVars(mode);
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  // Listen for OS-level preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme-mode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const setLight   = () => setMode("light");
  const setDark    = () => setMode("dark");

  const value = {
    mode,
    isDark: mode === "dark",
    isLight: mode === "light",
    toggleMode,
    setLight,
    setDark,
    tokens: tokens[mode],   // direct JS token access
    palette,                // raw palette values
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}

export default ThemeContext;
