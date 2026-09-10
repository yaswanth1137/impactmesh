# FLOWTRACE INTEGRATION ARCHITECTURE SPECIFICATION
**IMPACTMESH × FLOWTRACE Closed-Loop Execution Bridge (Phase 3.5 — Real FlowTrace Codebase Integration)**

Company: **BLACKTIDE SYSTEMS**  
Product: **Decision Impact Intelligence**  
System: **IMPACTMESH Execution Layer Integration**  
Date: **September 2026**

---

## 1. Executive Summary

IMPACTMESH answers:
> **"WHAT SHOULD WE DO?"**  
> *(Event Ingestion → Business State → Impact Propagation → Constraint Scoring → Decision Options → Strategic Recommendation)*

FLOWTRACE answers:
> **"HOW DO WE EXECUTE THE APPROVED RESPONSE?"**  
> *(Human Approval → Execution Plan Generation → Real FlowTrace Workflow Engine → LangGraph Analysis & Step Dispatch → Real FlowTrace Audit Logs → Typed DecisionEvents → State Transition Engine)*

By coupling IMPACTMESH and the **REAL FlowTrace codebase** through a strict, event-driven adapter boundary, we complete an authentic **closed feedback loop**:
```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           IMPACTMESH CORE                              │
  │                                                                        │
  │   DecisionEvent ──> EventValidator ──> StateTransitionEngine           │
  │        ▲                                       │                       │
  │        │                                       ▼                       │
  │        │                                 BusinessState                 │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │        │                                 Impact Analysis               │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │        │                             Strategic Recommendation          │
  └────────┼───────────────────────────────────────┬───────────────────────┘
           │                                       │
           │                                       ▼
           │                             [ HUMAN APPROVAL GATE ]
           │                                       │
           │                                       ▼
  ┌────────┼───────────────────────────────────────┼───────────────────────┐
  │        │                                       ▼                       │
  │        │                                 ExecutionPlan                 │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │        │                           flowtrace-real-bridge.ts            │
  │        │                         (Translation to FlowTrace)            │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │        │                            REAL FLOWTRACE CODEBASE            │
  │        │                        - WorkflowDefinition (DAG nodes/edges) │
  │        │                        - WorkflowGraph (@xyflow/react)        │
  │        │                        - In-Memory DB (flowtrace/server/db.ts)│
  │        │                        - LangGraph Change Pipeline            │
  │        │                        - Real Audit Logs (db.addAuditLog)     │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │   DecisionEvent <── ExecutionStep Completed ───┘                       │
  │   (with executionContext provenance:                                   │
  │    decisionId, recommendationId, planId, stepId)                       │
  │                                                                        │
  │                        FLOWTRACE REAL EXECUTION                        │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Actual FlowTrace Repository Architecture & Analysis

Inspection of the real FlowTrace repository (`https://github.com/NManishkumar/FLOWTRACE-.git`) revealed:

| Property | Real FlowTrace Implementation |
| :--- | :--- |
| **1. Source Repository** | `https://github.com/NManishkumar/FLOWTRACE-.git` |
| **2. Local Location** | `flowtrace/` in the workspace root |
| **3. Framework & Tooling** | React 19 (`^19.2.8`), Vite 8 (`^8.2.0`), TypeScript (`~6.0.2`), Tailwind CSS v4 (`^4.2.1`) |
| **4. Graph / Workflow Engine** | `@xyflow/react` (`^12.11.3`) for DAG interactive node-and-edge visualization (`WorkflowGraph.tsx`) |
| **5. Persistence** | Real in-memory persistence engine (`flowtrace/server/db.ts`) with typed Maps for workflows, services, dependencies, production changes, risk events, and audit logs |
| **6. Execution Pipeline** | LangGraph multi-stage execution and analysis pipeline (`flowtrace/server/langgraph.ts`) comprising `ChangeDetectionNode`, `DependencyTraceNode`, `ImpactPredictionNode`, `RiskAssessmentNode`, and `RecommendationNode` |
| **7. Real UI Components** | `WorkflowGraph.tsx` (React Flow canvas with custom edge rendering, status badges, and zoom/pan navigation), `Sidebar.tsx`, `Topbar.tsx`, `CreateWorkflowModal.tsx` |
| **8. Standalone Build** | Fully self-contained build: `npm --prefix flowtrace run build` produces production bundles in under 2 seconds with 0 errors |

---

## 3. Integration Strategy Selected & Justification

### Strategy Selected: Monorepo/Subproject Route & Module Integration

We incorporated the real FlowTrace codebase directly under `flowtrace/` in the root repository.

### Why This Strategy Was Selected:
1. **Preserves Real FlowTrace Code**: The entire FlowTrace source tree (`src/`, `server/`, `data/`, `package.json`, `tsconfig.json`, `vite.config.ts`) remains authentic and uncompromised.
2. **Standalone Integrity**: The FlowTrace project builds independently with `npm --prefix flowtrace run build` without any modification to its core contracts.
3. **Single Local Hackathon Deployment**: Developers and judges run a single command (`npm run dev`) to serve both the IMPACTMESH Command Center and the real FlowTrace execution suite (`/flowtrace`).
4. **Direct Component & Engine Reuse**: IMPACTMESH imports the real `WorkflowGraph` React Flow canvas directly into `FlowTraceRoute.tsx`, and invokes the real FlowTrace database (`db.saveWorkflow`, `db.addAuditLog`, `db.getAuditLogs`) and LangGraph analysis pipeline directly from `flowtrace-real-bridge.ts`.
5. **Reproducible GitHub Collaboration**: The entire codebase is version-controlled in git without fragile git submodule credential barriers or broken external npm dependencies.

---

## 4. Where the REAL FlowTrace Source Lives

The real FlowTrace repository is located at:
```
c:\Users\yaswa\impact_mesh\flowtrace\
├── data/                       # FlowTrace seed telemetry, changes, workflows
├── server/
│   ├── api.ts                  # Real FlowTrace REST endpoints
│   ├── datasetEngine.ts        # FlowTrace dataset processing
│   ├── db.ts                   # Real FlowTrace in-memory database & audit store
│   ├── groq.ts                 # Real FlowTrace LLM client
│   └── langgraph.ts            # Real FlowTrace LangGraph multi-stage pipeline
├── src/
│   ├── components/
│   │   ├── WorkflowGraph.tsx   # Real FlowTrace React Flow DAG component
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── pages/                  # Overview, Workflows, ImpactSimulator, RiskEvents, AuditLog
│   ├── services/api.ts         # Real FlowTrace API client
│   └── types/index.ts          # FlowTrace domain contracts (WorkflowDefinition, WorkflowNodeData, etc.)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. REAL FlowTrace Components Being Used

1. **`flowtrace/src/components/WorkflowGraph.tsx`**:
   - Rendered directly inside `src/app/routes/FlowTraceRoute.tsx`.
   - Displays the execution DAG using `@xyflow/react` with custom styled nodes, status indicators (`healthy`, `warning`, `critical`, `changed`), dependency edges, and interactive node selection.
2. **`flowtrace/server/db.ts`**:
   - Stores the translated execution plan as a native FlowTrace `WorkflowDefinition` via `db.saveWorkflow()`.
   - Records audit log entries for every executed step via `db.addAuditLog()`.
   - Queried in real-time by both test suites and UI components.
3. **`flowtrace/server/langgraph.ts`**:
   - Executes multi-stage evaluation (`runLangGraphAnalysis`) during step execution, producing risk assessments, dependency propagation, and telemetry stamps.
4. **`flowtrace/src/types/index.ts`**:
   - Authoritative FlowTrace interfaces (`WorkflowDefinition`, `WorkflowNodeData`, `WorkflowEdgeData`, `AuditEntry`, `RiskEventItem`) used for contract translation.

---

## 6. Translation Adapter: ExecutionPlan ↔ FlowTrace Workflow

The translation adapter is located in [`server/services/flowtrace/flowtrace-real-bridge.ts`](file:///c:/Users/yaswa/impact_mesh/server/services/flowtrace/flowtrace-real-bridge.ts):

### Step Mapping (`ExecutionStep` → `WorkflowNodeData`):
- `step.id` $\to$ `node.id`
- `step.department` $\to$ FlowTrace `ServiceNodeType` (`decision`, `system`, `agent`, `approval`)
- `step.title` $\to$ `node.label` with department prefix
- `step.status` $\to$ FlowTrace status (`completed` $\to$ `healthy`, `ready` $\to$ `warning`, `running` $\to$ `changed`, `blocked` $\to$ `critical`)
- `step.dependsOn` $\to$ Node dependency counts and impact classifications (`downstream_impact`, `direct_impact`, `unaffected`)

### Plan Mapping (`ExecutionPlan` → `WorkflowDefinition`):
- Generates DAG edges for all `step.dependsOn` relationships with protocol `EXECUTION_COUPLING` and `DIRECT` propagation.
- Computes overall workflow health score and risk level based on completed step progression.
- Registers the workflow into FlowTrace DB via `registerPlanInFlowTraceDB()`.

---

## 7. Execution Completion → DecisionEvent Mapping

When an operator triggers step execution (via UI or automated bridge):
1. **Dependency Check**: Validates that all prerequisite steps in `step.dependsOn` are `completed`.
2. **FlowTrace Execution**: Invokes FlowTrace's LangGraph pipeline and writes an audit record into FlowTrace DB (`db.addAuditLog`).
3. **DecisionEvent Construction**: Emits a strongly-typed `DecisionEvent` retaining full provenance:
   ```ts
   {
     id: "evt-ft-real-step-product-freeze-01-...",
     department: "product",
     event_type: "feature_deprioritized",
     execution_context: {
       executionPlanId: "plan-...",
       executionStepId: "step-product-freeze-01",
       decisionId: "dec-fin-01",
       recommendationId: "rec-fin-01",
       sequence: 1
     }
   }
   ```
4. **State Transition**: The event is passed strictly through `StateTransitionEngine.applyEvent()` to update `BusinessState`.
5. **Downstream Unblocking**: The bridge inspects downstream steps, promoting any blocked steps whose prerequisites are now satisfied from `blocked` to `ready`.

---

## 8. Preserved Phase 3 Artifacts

The following Phase 3 files were preserved and enhanced:
- [`src/types/execution.ts`](file:///c:/Users/yaswa/impact_mesh/src/types/execution.ts): Authoritative execution contracts (`ExecutionPlan`, `ExecutionStep`, `ExecutionContext`).
- [`server/services/flowtrace/flowtrace.interface.ts`](file:///c:/Users/yaswa/impact_mesh/server/services/flowtrace/flowtrace.interface.ts): Adapter interface specification.
- [`server/services/flowtrace/blacktide-execution-plan.ts`](file:///c:/Users/yaswa/impact_mesh/server/services/flowtrace/blacktide-execution-plan.ts): Canonical 4-step execution template.
- [`server/services/flowtrace/flowtrace.adapter.ts`](file:///c:/Users/yaswa/impact_mesh/server/services/flowtrace/flowtrace.adapter.ts): Updated to delegate workflow registration and step audit tracking to real FlowTrace DB.
- [`src/app/routes/FlowTraceRoute.tsx`](file:///c:/Users/yaswa/impact_mesh/src/app/routes/FlowTraceRoute.tsx): Updated to mount real FlowTrace `WorkflowGraph` React Flow canvas.
- [`tests/flowtrace/flowtrace-bridge.test.ts`](file:///c:/Users/yaswa/impact_mesh/tests/flowtrace/flowtrace-bridge.test.ts): Expanded from 10 to 14 tests, verifying both adapter contracts and real FlowTrace components.

---

## 9. Verification Summary

| Test Suite / Command | Result |
| :--- | :--- |
| `npm run typecheck` (`tsc -b --noEmit`) | **Passed (0 errors)** |
| `npx vitest run` (All 9 test suites, 37 tests) | **37 passed (100%)** |
| `npm run build` (Root project) | **Built in 2.10s (0 errors)** |
| `npm --prefix flowtrace run build` (Real FlowTrace) | **Built in 1.48s (0 errors)** |
