/**
 * IMPACTMESH — Mechanical & Route Motion System
 * Stepped, deliberate transitions that feel like instrumentation rather than bouncy web animations.
 */

export const MOTION = {
  durations: {
    instant: '80ms',
    mechanical: '160ms',
    routeStep: '320ms',
    impactPulse: '600ms',
    cascadeSpread: '1200ms',
  },
  easings: {
    // Stepped mechanical response
    mechanical: 'cubic-bezier(0, 0, 0.2, 1)',
    routePlot: 'cubic-bezier(0.25, 1, 0.5, 1)',
    pulse: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;
