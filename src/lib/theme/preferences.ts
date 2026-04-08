export const THEME_MODE_STORAGE_KEY = "vahan-theme-mode";
export const THEME_ACCENT_STORAGE_KEY = "vahan-theme-accent";

export const themeModes = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof themeModes)[number];

export const themeAccents = ["copper", "ocean", "evergreen"] as const;
export type ThemeAccent = (typeof themeAccents)[number];

export function resolveThemeMode(mode: ThemeMode, prefersDark: boolean) {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }

  return mode;
}

export function applyThemePreference(mode: ThemeMode, accent: ThemeAccent) {
  if (typeof window === "undefined") return;

  const resolvedMode = resolveThemeMode(
    mode,
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  document.documentElement.dataset.theme = resolvedMode;
  document.documentElement.dataset.accent = accent;
}

export function getThemeBootstrapScript() {
  return `
    (function () {
      try {
        var mode = localStorage.getItem("${THEME_MODE_STORAGE_KEY}") || "system";
        var accent = localStorage.getItem("${THEME_ACCENT_STORAGE_KEY}") || "copper";
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var resolvedMode = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
        document.documentElement.classList.toggle("dark", resolvedMode === "dark");
        document.documentElement.dataset.theme = resolvedMode;
        document.documentElement.dataset.accent = accent;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.dataset.accent = "copper";
      }
    })();
  `;
}
