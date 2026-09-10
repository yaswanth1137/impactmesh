/**
 * IMPACTMESH // BLACKTIDE SYSTEMS
 * Groq Structured Strategic Reasoning Service
 */

import { Groq } from 'groq-sdk';
import { env } from '../../config/env.ts';
import type {
  ReasoningContext,
  GroqReasoningResponse,
  GroqReasoningOptions
} from '../../types/groq.ts';
import { GroqRequestError } from '../../types/errors.ts';
import { generateMockGroqReasoning } from './mock-groq.ts';

const SYSTEM_PROMPT = `
You are the Strategic Reasoning Engine for IMPACTMESH (Blacktide Systems), an executive decision impact intelligence platform.
Your mission: Given deterministic facts, cascade evidence, and scored feasible options, synthesize a crisp executive recommendation and Captain's Log entry.

You MUST respond strictly in valid JSON format matching this schema:
{
  "recommendation": {
    "recommendedOptionId": string,
    "title": string,
    "rationale": string,
    "strategicObjective": string,
    "confidenceScore": number (0.00 to 1.00),
    "bearingDeltaDegrees": number,
    "projectedMetrics": {
      "revenueImpactINR": number,
      "budgetSavingsINR": number,
      "capacityDeficitDeltaHours": number,
      "deliveryDelayDeltaDays": number
    },
    "tradeoffs": [
      {
        "department": string,
        "sacrifice": string,
        "benefit": string
      }
    ],
    "riskMitigations": [string],
    "evidenceCitations": [string]
  },
  "executiveBrief": string,
  "captainLogEntry": {
    "headline": string,
    "logText": string,
    "severity": "NORMAL" | "WARNING" | "CRITICAL",
    "suggestedAction": string
  }
}
Do NOT include markdown fences or any text outside the JSON object.
`;

export class GroqReasoningService {
  private client: Groq | null = null;

  private getClient(): Groq | null {
    if (!env.isGroqConfigured || !env.groqApiKey) {
      return null;
    }

    if (!this.client) {
      try {
        this.client = new Groq({
          apiKey: env.groqApiKey,
          dangerouslyAllowBrowser: true
        });
      } catch (err) {
        console.warn('[GroqService] Client initialization failed:', err);
        return null;
      }
    }

    return this.client;
  }

  public async reasonWithGroq(
    context: ReasoningContext,
    options: GroqReasoningOptions = {}
  ): Promise<GroqReasoningResponse> {
    const startTime = Date.now();

    if (options.forceMock || !env.isGroqConfigured || !env.groqApiKey) {
      return generateMockGroqReasoning(context, options.model || env.groqModel);
    }

    const client = this.getClient();
    if (!client) {
      return generateMockGroqReasoning(context, options.model || env.groqModel);
    }

    const model = options.model || env.groqModel;
    const timeoutMs = options.timeoutMs || 10000;

    const userPrompt = `
Decision Context:
- Decision Title: ${context.decisionTitle}
- Trigger Event: ${JSON.stringify(context.triggerEvent, null, 2)}
- Business Position: ${JSON.stringify(context.businessPosition, null, 2)}
- Downstream Evidence Cascade: ${JSON.stringify(context.impactEvidence, null, 2)}
- Scored Action Options: ${JSON.stringify(context.feasibleOptions, null, 2)}

Provide the synthesized strategic recommendation, executive brief, and Captain's Log entry.
`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const completion = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1500,
          response_format: { type: 'json_object' }
        },
        { signal: controller.signal }
      );

      clearTimeout(timer);

      const latencyMs = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new GroqRequestError(
          'GROQ_MALFORMED_OUTPUT',
          'Groq returned an empty response body.'
        );
      }

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        throw new GroqRequestError(
          'GROQ_MALFORMED_OUTPUT',
          'Failed to parse Groq response as JSON schema',
          { rawContent: content }
        );
      }

      if (!parsed.recommendation || !parsed.executiveBrief || !parsed.captainLogEntry) {
        throw new GroqRequestError(
          'GROQ_MALFORMED_OUTPUT',
          'Groq response JSON is missing required top-level keys',
          { parsed }
        );
      }

      return {
        recommendation: parsed.recommendation,
        executiveBrief: parsed.executiveBrief,
        captainLogEntry: parsed.captainLogEntry,
        modelUsed: model,
        latencyMs,
        isMock: false
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new GroqRequestError(
          'GROQ_REQUEST_FAILED',
          `Groq request timed out after ${timeoutMs}ms`,
          { timeoutMs }
        );
      }

      if (err.status === 401 || err.message?.includes('invalid_api_key')) {
        throw new GroqRequestError(
          'GROQ_AUTH_ERROR',
          'Groq authentication failed: invalid API key'
        );
      }

      if (err.status === 429 || err.message?.includes('rate_limit')) {
        throw new GroqRequestError(
          'GROQ_RATE_LIMIT',
          'Groq API rate limit exceeded'
        );
      }

      if (err instanceof GroqRequestError) {
        throw err;
      }

      // If live call fails in development, gracefully fall back to deterministic mock reasoning
      console.warn('[GroqService] Live call failed, falling back to mock reasoning:', err.message);
      return generateMockGroqReasoning(context, model);
    }
  }
}

export const groqReasoningService = new GroqReasoningService();
