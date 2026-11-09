import { describe, expect, it } from 'vitest';
import { FESTIVE_ROTATION_MS, festiveVariantAt, msUntilNextFestiveSwitch, nextSiteTheme, readSiteTheme, siteThemes, usesLightSurfaces } from './site-theme';

describe('three site themes', () => {
  it('offers only dark, light and festive', () => {
    expect(siteThemes).toEqual(['dark', 'light', 'festive']);
  });
  it('cycles dark to light to festive and back to dark', () => {
    expect(nextSiteTheme('dark')).toBe('light');
    expect(nextSiteTheme('light')).toBe('festive');
    expect(nextSiteTheme('festive')).toBe('dark');
  });
  it('defaults to festive and migrates the old Diwali choice', () => {
    expect(readSiteTheme('dark')).toBe('dark');
    expect(readSiteTheme('light')).toBe('light');
    expect(readSiteTheme('diwali')).toBe('festive');
    expect(readSiteTheme(null)).toBe('festive');
  });
});

describe('festive rotation', () => {
  it('switches between Diwali and Chhath Puja every 5 minutes', () => {
    expect(FESTIVE_ROTATION_MS).toBe(300_000);
    expect(festiveVariantAt(0)).toBe('diwali');
    expect(festiveVariantAt(299_999)).toBe('diwali');
    expect(festiveVariantAt(300_000)).toBe('chhath');
    expect(festiveVariantAt(600_000)).toBe('diwali');
  });
  it('waits until the next 5-minute mark', () => {
    expect(msUntilNextFestiveSwitch(60_000)).toBe(240_000);
  });
  it('Chhath Puja uses light colours while Diwali stays dark', () => {
    expect(usesLightSurfaces('festive', 'chhath')).toBe(true);
    expect(usesLightSurfaces('festive', 'diwali')).toBe(false);
    expect(usesLightSurfaces('dark', 'chhath')).toBe(false);
  });
});
