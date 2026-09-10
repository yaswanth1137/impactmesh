/**
 * IMPACTMESH — Typography System
 * Balanced two/three-level typography:
 * Level 1: Pixel font for system titles, badges, readouts & tactical labels.
 * Level 2: Clean sans-serif for narrative evidence, strategic rationale, and tables.
 * Level 3: Monospace for timestamps, telemetry, and event contracts.
 */

export const TYPOGRAPHY = {
  fonts: {
    pixel: '"Silkscreen", "VT323", monospace',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  sizes: {
    readoutXl: '2.25rem', // 36px - Primary metric values
    readoutLg: '1.5rem',   // 24px - Section values, gauge levels
    heading: '1.125rem',   // 18px - Panel headers, deck titles
    label: '0.75rem',      // 12px - Instrument field labels, status flags
    body: '0.875rem',      // 14px - Explanations, strategic rationale
    caption: '0.6875rem',  // 11px - Coordinates, timestamps, node metadata
    micro: '0.625rem',     // 10px - Stepped corner tags, route indices
  },
  letterSpacing: {
    tighter: '-0.03em',
    normal: '0em',
    wide: '0.06em',
    wider: '0.12em',
    widest: '0.2em', // Tactical label all-caps tracking
  },
} as const;
