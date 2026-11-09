export const siteThemes = ['dark', 'light', 'diwali'] as const;
export type SiteTheme = typeof siteThemes[number];

export const siteThemeLabels: Record<SiteTheme, string> = { dark: 'Dark', light: 'Light', diwali: 'Festive (Diwali)' };

export function readSiteTheme(value: string | null): SiteTheme {
  return value === 'dark' || value === 'light' || value === 'diwali' ? value : 'diwali';
}

export function nextSiteTheme(theme: SiteTheme): SiteTheme {
  return theme === 'dark' ? 'light' : theme === 'light' ? 'diwali' : 'dark';
}

export function applySiteTheme(theme: SiteTheme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('diwali', theme === 'diwali');
  document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
}
