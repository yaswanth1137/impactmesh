/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * Deterministic Mock Groq Reasoning Generator
 */

import type {
  ReasoningContext,
  GroqReasoningResponse,
  StrategicRecommendation
} from '../../types/groq.ts';

export function generateMockGroqReasoning(
  context: ReasoningContext,
  modelName: string = 'mock-groq-llama-70b'
): GroqReasoningResponse {
  const isBudgetCut = context.triggerEvent.eventType.includes('budget') || 
    context.decisionTitle.toLowerCase().includes('budget');

  const topOption = context.feasibleOptions[0] || {
    id: 'OPT-01',
    title: 'Reduce Custom Scope & Protect Delivery SLA',
    department: 'product',
    score: 91,
    estimatedSavingsINR: 240000
  };

  const recommendation: StrategicRecommendation = {
    recommendedOptionId: topOption.id,
    title: topOption.title || 'Reduce Non-Critical Feature Scope',
    rationale: isBudgetCut
      ? 'Preserve Apex Global core platform commitments while deselecting custom port dispatch integration to recover ₹2.4L in engineering burn and eliminate 120h capacity deficit.'
      : 'Realign committed milestone schedule to protect key revenue anchor and ensure delivery stability without compounding cross-departmental strain.',
    strategicObjective: 'Preserve ₹50.0L ARR relationship while adhering to new ₹11.0L budget constraint.',
    confidenceScore: 0.91,
    bearingDeltaDegrees: -27, // 314° NW -> 287° W
    projectedMetrics: {
      revenueImpactINR: 0,
      budgetSavingsINR: 240000,
      capacityDeficitDeltaHours: -120, // Eliminates deficit
      deliveryDelayDeltaDays: 0 // Protects delivery date
    },
    tradeoffs: [
      {
        department: 'Product',
        sacrifice: 'Defer custom port dispatch module to Q4 release track',
        benefit: 'Prevents 8-day cascade delay across core platform deployment'
      },
      {
        department: 'Operations',
        sacrifice: 'Requires scope renegotiation meeting with client technical lead',
        benefit: 'Reduces team overtime allocation from 140% back to sustainable 100%'
      },
      {
        department: 'Finance',
        sacrifice: 'Foregoes ₹3.0L custom add-on billing in immediate sprint',
        benefit: 'Brings total department expenditure within the new ₹11.0L hard ceiling'
      }
    ],
    riskMitigations: [
      'Issue immediate formal scope adjustment advisory to Apex Global account executive',
      'Lock core navigation gateway build at version 2.4-stable without custom fork',
      'Reassign 2 senior engineers to critical path integration testing'
    ],
    evidenceCitations: [
      'Node [BUDGET] decreased by ₹7.0L (from ₹18.0L to ₹11.0L)',
      'Node [CAPACITY] deficit identified: 120 hours needed vs 300 hours available',
      'Node [DELIVERY] projected slip of +8 days if custom module retained',
      'Node [CUSTOMER_APEX] ₹50.0L ARR at HIGH risk under unmitigated delivery slip'
    ]
  };

  const captainLogEntry = {
    headline: isBudgetCut ? 'BUDGET REDUCTION CASCADE DETECTED' : 'OPERATIONAL DEFICIT DETECTED',
    logText: `Command Deck analysis complete. Downstream cascade impacts 4 dependency hops and exposes ₹50L client relationship. Plotting course correction to reduce feature scope and preserve delivery bearing.`,
    severity: isBudgetCut ? ('WARNING' as const) : ('CRITICAL' as const),
    suggestedAction: 'Execute scope reduction course adjustment (Bearing 287° W).'
  };

  const executiveBrief = `IMPACTMESH Strategic Advisory: Following the ${context.triggerEvent.eventType} event from ${context.triggerEvent.department.toUpperCase()}, the system evaluated ${context.feasibleOptions.length} corrective courses. The primary recommendation is '${recommendation.title}' with 91% confidence, eliminating the 120h deficit while protecting the ₹50.0L Apex Global delivery timeline.`;

  return {
    recommendation,
    executiveBrief,
    captainLogEntry,
    modelUsed: `${modelName} (deterministic-mock-engine)`,
    latencyMs: 45,
    isMock: true
  };
}
