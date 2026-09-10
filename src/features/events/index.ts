// Feature boundary: Department event ingestion & dispatch
export * from '../../types/events.ts';
export { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
