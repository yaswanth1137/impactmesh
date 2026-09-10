// Feature boundary: Decision lifecycle management, FlowTrace execution bridge & option evaluation
export * from '../../types/execution.ts';
export {
  flowTraceAdapter,
  FlowTraceAdapter,
} from '../../../server/services/flowtrace/flowtrace.adapter.ts';
export type {
  IFlowTraceAdapter,
  StepExecutionResult,
} from '../../../server/services/flowtrace/flowtrace.interface.ts';
export {
  createCanonicalBlacktideExecutionPlan,
  CANONICAL_EXECUTION_PLAN_ID,
} from '../../../server/services/flowtrace/blacktide-execution-plan.ts';
