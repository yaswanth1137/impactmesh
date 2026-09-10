/**
 * IMPACTMESH — Blacktide Systems Color Palette
 * Retro-futurist maritime command deck color specification.
 */

export const PALETTE = {
  // Base Maritime Enclosure
  base: {
    deepSea: '#090B0F',    // Canvas background
    ink: '#101419',        // Inset sub-panels & command rail
    darkPanel: '#141A20',  // Primary instrument panels
    raisedPanel: '#1A2128',// Elevated widgets, headers, active cards
  },

  // Structural & Lines
  structure: {
    border: '#2A333B',      // Primary panel edge
    borderSubtle: '#1C242C',// Internal dividers & chart grid lines
    borderActive: '#D6A84F',// Active / targeted border
    cornerMarker: '#475664',// Stepped corner ticks & navigation crosshairs
  },

  // Technical Typography
  text: {
    primary: '#E8E4D8',     // High-contrast readout parchment
    secondary: '#A9ADA8',   // Auxiliary labels & descriptions
    muted: '#66727C',       // Telemetry IDs, timestamps, subtle units
    dim: '#3F4A54',         // Coordinates, grid ticks, disabled
  },

  // Strategic Accents
  accent: {
    brass: '#D6A84F',       // Primary Blacktide brass: key actions, navigation, alerts
    seaFoam: '#AFCBC2',     // Stable / healthy system state, verified waypoints
    navigationBlue: '#557A91', // Active route line, selected telemetry
    agedSand: '#C5B58F',    // Waypoint badges, secondary brass highlights
  },

  // Operational Semantic States
  semantic: {
    success: '#59A66A',     // Course clear / stable
    warning: '#D6A84F',     // Capacity / budget pressure warning
    danger: '#D05A4A',      // Critical cascade impact / deficit
    active: '#6A91A8',      // System transmitting / analyzing
  },

  // Department Identifiers
  departments: {
    sales: '#D6A84F',       // Lookout / Brass
    product: '#557A91',     // Chart Room / Nav Blue
    operations: '#C5B58F',  // Engine Room / Sand
    finance: '#59A66A',     // Treasury / Mint Green
    command: '#AFCBC2',     // Command Center / Sea Foam
  }
} as const;

export type ColorPalette = typeof PALETTE;
