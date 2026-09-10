/**
 * IMPACTMESH — Nautical Chart Grid & Spacing Geometry
 */

export const GRID = {
  // Discrete stepped pixel units
  unit: 4, // 4px base pixel quantum
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borders: {
    single: '1px solid #2A333B',
    subtle: '1px solid #1C242C',
    double: '3px double #2A333B',
    stepped: '2px solid #D6A84F',
  },
  corners: {
    // Sharp stepped corners, never large circular radius
    square: '0px',
    subtleCut: '2px',
    stepped: '4px',
  },
  shadows: {
    hardPixel: '2px 2px 0px #000000',
    deepPixel: '4px 4px 0px #050709',
    insetBevel: 'inset 1px 1px 0px #2A333B, inset -1px -1px 0px #090B0F',
  }
} as const;
