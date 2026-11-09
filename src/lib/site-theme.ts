/** The switch offers exactly three choices; "festive" rotates between festival designs. */
export const siteThemes = ['dark', 'light', 'festive'] as const;
export type SiteTheme = typeof siteThemes[number];

/** Festival designs shown inside the festive theme, in rotation order. */
export const festiveVariants = ['diwali', 'chhath'] as const;
export type FestiveVariant = typeof festiveVariants[number];

/** Each festival design stays for five minutes before the next one appears. */
export const FESTIVE_ROTATION_MS = 5 * 60 * 1000;

export const siteThemeLabels: Record<SiteTheme, string> = { dark: 'Dark', light: 'Light', festive: 'Festive' };
export const festiveVariantLabels: Record<FestiveVariant, string> = { diwali: 'Diwali', chhath: 'Chhath Puja' };

export function readSiteTheme(value: string | null): SiteTheme {
  if (value === 'dark' || value === 'light' || value === 'festive') return value;
  return 'festive'; // default, and migrates the earlier stored "diwali" choice
}

export function nextSiteTheme(theme: SiteTheme): SiteTheme {
  return theme === 'dark' ? 'light' : theme === 'light' ? 'festive' : 'dark';
}

/** Rotation is tied to the clock so every visitor sees the same festival at the same time. */
export function festiveVariantAt(timeMs: number): FestiveVariant {
  return festiveVariants[Math.floor(timeMs / FESTIVE_ROTATION_MS) % festiveVariants.length];
}

export function msUntilNextFestiveSwitch(timeMs: number): number {
  return FESTIVE_ROTATION_MS - (timeMs % FESTIVE_ROTATION_MS);
}

/** Chhath is a light-coloured festival design, so it builds on the light surfaces. */
export function usesLightSurfaces(theme: SiteTheme, variant: FestiveVariant): boolean {
  return theme === 'light' || (theme === 'festive' && variant === 'chhath');
}

export function applySiteTheme(theme: SiteTheme, variant: FestiveVariant) {
  const root = document.documentElement.classList;
  const light = usesLightSurfaces(theme, variant);
  root.toggle('light', light);
  root.toggle('diwali', theme === 'festive' && variant === 'diwali');
  root.toggle('chhath', theme === 'festive' && variant === 'chhath');
  document.documentElement.style.colorScheme = light ? 'light' : 'dark';
}
