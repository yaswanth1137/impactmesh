# FLOWTRACE INTEGRATION ARCHITECTURE SPECIFICATION
**IMPACTMESH × FLOWTRACE Closed-Loop Execution Bridge**

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
> *(Human Approval → Execution Plan Generation → Step-by-Step Dispatch → Evidence Telemetry → Execution Events)*

By coupling IMPACTMESH and FLOWTRACE through a strict, event-driven adapter boundary, we complete a **closed feedback loop**:
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
  │        │                               FlowTraceAdapter                │
  │        │                                       │                       │
  │        │                                       ▼                       │
  │   DecisionEvent <── ExecutionStep Completed ───┘                       │
  │   (with provenance context)                                            │
  │                                                                        │
  │                           FLOWTRACE LAYER                              │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. FlowTrace Architecture Discovered (Inspection Report)

Direct inspection of `https://github.com/NManishkumar/FLOWTRACE-.git` revealed the following concrete architectural characteristics:

| Property | FlowTrace Implementation |
| :--- | :--- |
| **1. Framework** | React 19 (`19.2.8`) + TypeScript (`~6.0.2`) |
| **2. Build Tool** | Vite 8 (`^8.2.0`) with `@vitejs/plugin-react` |
| **3. React Structure** | Single-page application shell with fixed sidebar navigation (`src/components/Sidebar.tsx`), top bar (`src/components/Topbar.tsx`), and five primary views (`Overview`, `Workflows`, `ImpactSimulator`, `RiskEvents`, `AuditLog`). |
| **4. Entry Points** | `src/main.tsx` mounting `src/App.tsx`. |
| **5. Routing** | Tab-based state navigation (`useState<NavigationPageId>('simulator')`), not react-router. |
| **6. State Management** | React `useState` hooks combined with service-level API abstraction (`src/services/api.ts`). |
| **7. Data Model** | Graph-centric DAG structures (`WorkflowDefinition`, `WorkflowNodeData`, `WorkflowEdgeData`), incident models (`RiskEventItem`), and audit entries (`AuditEntry`). |
| **8. Execution Model** | Interactive simulation pipeline with stage-based progression: `healthy` $\to$ `change_detected` $\to$ `tracing_dependencies` $\to$ `predicting_impact` $\to$ `risk_assessment` $\to$ `analysis_complete` $\to$ `workflow_paused`/`workflow_continued`. |
| **9. Workflow / Step Representation**| React Flow (`@xyflow/react`) node-edge canvas with interactive inspector panels and status badges. |
| **10. Existing APIs / Services** | REST client functions in `src/services/api.ts` connecting to `/api/overview`, `/api/workflows`, `/api/analyze-change`, `/api/operator-decision`, `/api/demo/run`, and `/api/demo/reset`. |
| **11. Existing Backend** | Self-contained Node HTTP middleware in `server/api.ts`, `server/db.ts`, and `server/langgraph.ts` running within the Vite dev server. |
| **12. Deployment Model** | Standalone web application with optional embedded API server, capable of operating 100% offline via bundled fallback mocks (`src/data/`). |
| **13. Execution Status Representation**| Status strings: `'healthy' \| 'warning' \| 'critical' \| 'changed'` on nodes; `'action_required' \| 'investigating' \| 'action_taken'` on risk events; `'completed' \| 'recommended' \| 'pending'` on audit entries. |
| **14. Step Creation** | Pre-configured or dynamically assembled through node-edge definitions (`WorkflowNodeData[]`, `WorkflowEdgeData[]`). |
| **15. Step Execution** | Triggered via `analyzeChange` or `recordOperatorDecision` calls which update backend database state and append audit log items. |
| **16. Execution Completion** | Emits `operator_action` audit entries and locks incident resolution state. |
| **17. Persistence Mechanism** | In-memory JavaScript Map database (`server/db.ts`) with seed reset capabilities. |

---

## 3. Integration Strategy Selection

We evaluated four possible architectural approaches:

### Strategy Evaluation

| Strategy | Description | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **A. Shared Package / npm** | Publish FlowTrace as an npm package. | High abstraction. | Requires publishing, version churn, and heavy build overhead for a local hackathon. | ❌ Rejected |
| **B. Monorepo Workspace** | Convert to pnpm/npm workspace with twin apps. | Code sharing. | Alters repository root structure and adds complex dev orchestrations. | ❌ Rejected |
| **C. Service / API Boundary** | FlowTrace runs on separate port; communicates via HTTP REST. | Process isolation. | Requires running 2 dev servers on separate ports; complicates local multi-device demo. | ⚠️ Partial |
| **D. Route-Based Application Integration (Chosen Strategy)** | Deep integration via dedicated `/flowtrace` route inside IMPACTMESH, backed by an isolated `FlowTraceAdapter` service. | Single-port local deployment, zero network fragility, unified visual styling, strict event-driven boundary. | Requires unified TypeScript contracts. | ✅ **SELECTED** |

### Selected Architecture: Hybrid Route & Service Boundary (Strategy D + C)
1. **Single Unified Server & Host**: IMPACTMESH hosts the `/flowtrace` route directly within its existing Vite setup.
2. **Design Language Alignment**: The FlowTrace execution experience adopts the Blacktide **Pixel Command Deck** visual system (Navy `#0D131A`, Brass `#D6A84F`, Seafoam `#59A66A`), eliminating CSS utility collisions from Tailwind v4.
3. **Decoupled State Ownership**: FlowTrace *never* modifies `BusinessState` directly. It communicates exclusively by emitting typed `DecisionEvent`s through `FlowTraceAdapter`.

---

## 4. Ownership Boundaries & Contracts

```
┌────────────────────────────────────────────────────────┐
│                   IMPACTMESH OWNS:                     │
│  - Authoritative BusinessState (Financial, Ops, Scope) │
│  - Dependency Graph & Multi-Department Topologies      │
│  - Strategic Recommendations                           │
│  - Human Approval State                                │
│  - Immutable Append-Only Event Store                   │
│  - State Transition Engine                             │
└────────────────────────────────────────────────────────┘
                           │
                 [ FlowTraceAdapter ]
                           │
┌────────────────────────────────────────────────────────┐
│                   FLOWTRACE OWNS:                      │
│  - ExecutionPlan Lifecycle                             │
│  - ExecutionStep Sequencing & Dependency Gating        │
│  - Step Execution Status (pending, running, completed) │
│  - Operational Evidence Telemetry & Audit Stamps       │
│  - Emitting Completed Step DecisionEvents              │
└────────────────────────────────────────────────────────┘
```

---

## 5. Execution Contract Specification

Defined in [`src/types/execution.ts`](file:///c:/Users/yaswa/impact_mesh/src/types/execution.ts):

### Core Types:
- **`ExecutionStatus`**: `'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'blocked' | 'skipped'`
- **`ExecutionPlan`**:
  - `id: string`
  - `decisionId: string`
  - `title: string`
  - `objective: string`
  - `sourceRecommendationId: string`
  - `status: ExecutionStatus`
  - `approvedAt: string | null`
  - `approvedBy: string | null`
  - `steps: ExecutionStep[]`
  - `expectedOutcome: string`
- **`ExecutionStep`**:
  - `id: string`
  - `planId: string`
  - `sequence: number` (1-indexed order)
  - `department: DepartmentCode` (`product`, `operations`, `sales`, `finance`)
  - `actionType: string`
  - `title: string`
  - `description: string`
  - `inputs: Record<string, unknown>`
  - `dependsOn: string[]` (preceding step IDs that must be `completed`)
  - `expectedStateChanges: Record<string, unknown>`
  - `status: ExecutionStatus`
  - `startedAt?: string`
  - `completedAt?: string`
  - `resultingEvent?: Partial<DecisionEvent>`
- **`ExecutionContext`** (Provenance tracking attached to resulting `DecisionEvent`):
  - `executionPlanId: string`
  - `executionStepId: string`
  - `decisionId: string`
  - `recommendationId: string`

---

## 6. The Canonical Blacktide Execution Sequence

Based on the core incident: **Budget Reduced from ₹18L to ₹11L (-₹7.0L deficit) at 140% capacity utilization**, the strategic recommendation is **"REDUCE FEATURE SCOPE"**.

FlowTrace executes the approved 4-step sequence:

| Step | Department | Action | Input / Target | Resulting DecisionEvent | Expected State Mutation |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **Product** | Freeze non-critical custom analytics scope | `freed_capacity_hours: 120` | `feature_deprioritized` | Engineering demand drops from 420h to 300h. |
| **2** | **Operations** | Reallocate and balance platform engineering capacity | `new_capacity_hours: 300` | `capacity_changed` | Utilization normalizes from 140% to 100%. |
| **3** | **Sales** | Deliver client phasing protocol (SAML on track; Analytics Phase 2) | `new_deadline: '60 DAYS'` | `deadline_changed` | Delivery slippage risk eliminated. |
| **4** | **Finance** | Audit and lock contractor savings | `delta_amount: -240000` | `cost_changed` | Committed cost reduced; cash runway extended. |

---

## 7. Closed-Loop Lifecycle Verification

1. **Human Approval**: The operator clicks `[ APPROVE EXECUTION ROUTE ]`.
2. **Step Dispatch**: Step 1 executes $\to$ generates `feature_deprioritized`.
3. **Validation & Transition**: The event passes through `EventValidator` $\to$ `StateTransitionEngine`.
4. **State Update**: `BusinessState` reflects updated capacity utilization.
5. **Next Step Unblocked**: Step 2 detects Step 1 completion, transitioning from `blocked` to `ready`.
6. **Command Center Real-time Observation**: Command Deck reflects updated metrics instantly.
