import { createContext, useContext, useState, useEffect } from "react";

// ─── Palette ────────────────────────────────────────────────────────────────

export const palette = {
  // Brand primaries
  orchidLight:  "#EDD5E7",
  orchid:       "#D498CA",
  orchidDark:   "#A9709F",
  magenta:      "#C53683",
  magentaDark:  "#8E245C",
  magentaDeep:  "#5C1439",

  // Tints & backgrounds
  warmWhite:    "#FDF9FC",
  blush:        "#FAF0F7",
  softGray:     "#EDE6EB",

  // Neutrals
  mauveGray:    "#9A8A96",
  darkMauve:    "#4A3A46",
  charcoal:     "#2C1F2A",

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
    bgSubtle:       palette.blush,
    bgMuted:        palette.softGray,

    // Brand fills
    bgBrand:        palette.magenta,
    bgBrandHover:   palette.magentaDark,
    bgBrandSubtle:  palette.orchidLight,

    // Text
    textPrimary:    palette.charcoal,
    textSecondary:  palette.darkMauve,
    textTertiary:   palette.mauveGray,
    textOnBrand:    "#FFFFFF",
    textBrand:      palette.magenta,
    textBrandDark:  palette.magentaDark,

    // Borders
    borderDefault:  palette.softGray,
    borderBrand:    palette.orchid,
    borderStrong:   palette.orchidDark,

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
    bgPage:         "#1A0F18",
    bgSurface:      "#231520",
    bgSubtle:       "#2E1D2B",
    bgMuted:        "#3A2737",

    // Brand fills
    bgBrand:        palette.magenta,
    bgBrandHover:   "#D94090",
    bgBrandSubtle:  "#3D1A33",

    // Text
    textPrimary:    "#F5EDF3",
    textSecondary:  palette.orchidLight,
    textTertiary:   palette.orchidDark,
    textOnBrand:    "#FFFFFF",
    textBrand:      "#E060A8",
    textBrandDark:  palette.orchid,

    // Borders
    borderDefault:  "#3D2A3A",
    borderBrand:    palette.magentaDark,
    borderStrong:   palette.magenta,

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
    return (
      localStorage.getItem("theme-mode") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
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
