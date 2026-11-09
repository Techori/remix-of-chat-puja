import { describe, expect, it } from 'vitest';
import { nextSiteTheme, readSiteTheme } from './site-theme';

describe('three site themes', () => {
  it('cycles dark to light to Diwali and back to dark', () => {
    expect(nextSiteTheme('dark')).toBe('light');
    expect(nextSiteTheme('light')).toBe('diwali');
    expect(nextSiteTheme('diwali')).toBe('dark');
  });
  it('restores Diwali and defaults to Diwali', () => {
    expect(readSiteTheme('diwali')).toBe('diwali');
    expect(readSiteTheme('dark')).toBe('dark');
    expect(readSiteTheme('light')).toBe('light');
    expect(readSiteTheme('unknown')).toBe('diwali');
    expect(readSiteTheme(null)).toBe('diwali');
  });
});