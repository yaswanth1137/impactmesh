# IMPACTMESH

> **"See what a decision affects — before you make it."**  
> *Built for Hackathon Team PIRATE*

IMPACTMESH is a **Decision Impact Intelligence system** modeling **Blacktide Systems** (a fictional high-growth B2B SaaS company). It unifies four autonomous operational departments into a synchronized, real-time organizational dependency mesh.

---

## 1. System Architecture

```
                                  [ PHYSICAL CLIENTS ]
  +------------------+    +------------------+    +-------------------+    +------------------+
  | 1. Sales Mobile  |    | 2. Product Mobile|    | 3. Engineering Mob|    | 4. Finance Mobile|
  +--------+---------+    +--------+---------+    +---------+---------+    +--------+---------+
           |                       |                        |                       |
           +-----------------------+-----------+------------+-----------------------+
                                               |
                                               v  (Strongly-Typed Department Events)
                                  +---------------------------+
                                  | Supabase PostgreSQL DB    |
                                  | `decision_events` Table   |
                                  +-------------+-------------+
                                                |
                                                v  (Postgres Realtime / Server Trigger)
+---------------------------------------------------------------------------------------------------+
| THREE-LAYER INTELLIGENCE ARCHITECTURE                                                             |
|                                                                                                   |
|  [ LAYER 1: IMPACT ENGINE ]                                                                       |
|  - 100% Deterministic & Statistical Calculations                                                  |
|  - Dependency Graph Cascade Traversal (BFS multi-hop path tracing)                                |
|  - Mathematical Metric Deltas (Budget, Capacity Utilization, Pressure)                            |
|  - Algorithmic Risk Assessment & Bottleneck Identification                                        |
|                                                                                                   |
|  [ LAYER 2: DECISION ENGINE ]                                                                     |
|  - Generates Discrete Candidate Actions (Accept, Negotiate, Scale, Delay, Pivot)                  |
|  - Policy Alignment Scoring across CEO, CFO, and COO Dimension Weights                            |
|  - Feasibility, Tradeoff, and Downside Profiling                                                  |
|                                                                                                   |
|  [ LAYER 3: REASONING ENGINE (GROQ) ]                                                             |
|  - Strictly Server-Side Execution (Isolated from browser bundle)                                  |
|  - Operates ONLY on structured evidence dossiers (DB facts, graph relations, metrics)             |
|  - Groq is NEVER the source of truth for numeric metrics or calculations                         |
|  - Produces executive strategic rationale, tradeoff explanations, and counterfactuals             |
+---------------------------------------------------------------------------------------------------+
                                                |
                                                v  (Realtime State Broadcast)
                                  +---------------------------+
                                  | Supabase Realtime Channel |
                                  | `impactmesh:state`        |
                                  +-------------+-------------+
                                                |
                                                v
                                  +---------------------------+
                                  | 5. COMMAND CENTER LAPTOP  |
                                  | Real-time Dependency Mesh |
                                  | Instant State Reaction    |
                                  +---------------------------+
```

---

## 2. Event-Driven Workflow

Whenever an operational department acts, an immutable event is emitted:

$$\text{EVENT} \longrightarrow \text{validate} \longrightarrow \text{store} \longrightarrow \text{update business state} \longrightarrow \text{traverse dependencies} \longrightarrow \text{calculate impact} \longrightarrow \text{generate alternatives} \longrightarrow \text{score alternatives} \longrightarrow \text{Groq strategic reasoning} \longrightarrow \text{save result} \longrightarrow \text{broadcast} \longrightarrow \text{clients update}$$

### Department Event Families
- **Sales / CRM**: `customer_added`, `deal_created`, `deal_value_changed`, `deadline_changed`, `deal_accepted`, `customer_risk_changed`
- **Product**: `feature_requested`, `feature_committed`, `feature_scope_changed`, `feature_deprioritized`, `launch_date_changed`, `priority_changed`
- **Engineering / Ops**: `capacity_changed`, `resource_unavailable`, `delivery_delay`, `infrastructure_cost_changed`, `supplier_delay`
- **Finance**: `budget_changed`, `cost_changed`, `spending_freeze`, `funding_approved`, `runway_changed`

---

## 3. Physical Device Topology

| Device | Role | Primary Operational Activity |
| :--- | :--- | :--- |
| **Device 1** | **Sales / CRM Mobile** | Deal intake, customer expansion requests, SLA deadlines |
| **Device 2** | **Product Mobile** | Feature roadmaps, sprint commitments, scope changes |
| **Device 3** | **Engineering / Ops Mobile** | Team capacity allocations, delivery delays, infrastructure cost alerts |
| **Device 4** | **Finance Mobile** | Budget modifications, spend freezes, cash runway tracking |
| **Device 5** | **Command Center Laptop** | Central cross-department situational awareness, live dependency graph |

---

## 4. Repository Structure

```text
impact_mesh/
├── .env.example                     # Environment template (Client vs. Server credentials)
├── .gitignore                       # Strict protection for secret keys and local envs
├── package.json                     # Minimal dependencies (Vite, React 19, Supabase, Lucide, Vitest, Tailwind)
├── tsconfig.json                    # Strict TypeScript configuration
├── vite.config.ts                   # Vite bundler with Tailwind CSS plugin
├── README.md                        # Architectural specification and guide
│
├── src/                             # Client-side Application Layer
│   ├── app/
│   │   └── App.tsx                  # Architectural foundation console
│   ├── components/                  # Phase 2 UI component boundaries
│   │   ├── common/                  # UI primitives
│   │   ├── department/              # Mobile department views
│   │   ├── command-center/          # Command center laptop view
│   │   ├── graph/                   # React Flow dependency graph boundary
│   │   ├── timeline/                # Real-time event stream timeline
│   │   └── simulation/              # What-if scenario simulation
│   ├── features/                    # Feature domain boundaries
│   │   ├── decisions/
│   │   ├── events/
│   │   ├── business-state/
│   │   ├── impact-analysis/
│   │   └── recommendations/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Typed Supabase client with offline fallback
│   │   │   └── types.ts             # Strongly typed Database table & JSON schemas
│   │   ├── realtime/
│   │   │   ├── subscription-manager.ts # Decoupled real-time subscription manager
│   │   │   └── channel-service.ts      # Event publisher service for devices
│   │   ├── api/
│   │   │   └── reasoning-client.ts     # Client boundary for strategic reasoning
│   │   └── utils/
│   │       └── formatters.ts           # Indian Lakhs/Crores, percentages, timestamps
│   ├── types/
│   │   ├── domain.ts                # Organization, BusinessState, Dependency, ImpactResult
│   │   ├── events.ts                # Strongly typed department events & payload map
│   │   ├── entities.ts              # Extensible BusinessEntity definitions & metadata
│   │   ├── policies.ts              # Executive policy types (CEO, CFO, COO dimensions)
│   │   └── index.ts                 # Barrel export
│   └── config/
│       ├── env.ts                   # Client environment validation
│       └── constants.ts             # Departments, device topology, thresholds
│
├── server/                          # Server-Side Engine Boundaries
│   ├── api/
│   │   └── reasoning-routes.ts      # Server-side reasoning route handler boundary
│   ├── engines/
│   │   ├── impact-engine/           # Layer 1: Pure deterministic calculations
│   │   │   ├── impact-engine.interface.ts
│   │   │   └── impact-engine.service.ts
│   │   ├── decision-engine/         # Layer 2: Action generation & policy scoring
│   │   │   ├── decision-engine.interface.ts
│   │   └── decision-engine.service.ts
│   │   └── reasoning-engine/        # Layer 3: Strategic synthesis via Groq
│   │       ├── reasoning-engine.interface.ts
│   │       └── reasoning-engine.service.ts
│   ├── services/
│   │   └── groq-service.ts          # Server-only Groq API abstraction & evidence prompt
│   ├── policies/
│   │   └── executive-policies.ts    # Baseline CEO, CFO, COO policy weight matrices
│   └── types/
│       └── server-types.ts          # StructuredReasoningEvidence contract
│
├── supabase/                        # Database Infrastructure
│   ├── migrations/
│   │   └── 20260909000001_initial_schema.sql # 10 logical tables, JSONB, indexes, Realtime
│   └── seed/
│       └── 01_blacktide_systems.sql          # Blacktide Systems scenario, entities & graph
│
└── tests/                           # Unit Test Suites (Vitest)
    ├── impact-engine/
    │   └── impact-engine.test.ts    # Graph traversal & deterministic metric delta tests
    ├── decision-engine/
    │   └── decision-engine.test.ts  # Option generation & policy alignment tests
    └── realtime/
        └── subscription-manager.test.ts # Decoupled subscription lifecycle tests
```

---

## 5. Security & Isolation Model

- **Browser Bundle Safety**: Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read in the frontend.
- **Server Keys Isolation**: `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are isolated to `server/` and never included in the browser bundle or exposed via client code.
- **LLM Restriction**: Groq is never granted raw database access or mathematical authority. It receives only structured, pre-calculated evidence dossiers produced by Layer 1 and Layer 2.

---

## 6. Getting Started & Verification Commands

### Prerequisites
- Node.js `v20+` or `v22+`
- npm `10+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project URL, Anon Key, and server-side Groq API Key.

### 3. Run Unit Tests (Vitest)
```bash
npm run test
```
Runs test suites verifying deterministic graph cascades, rule-based option generation, and decoupled realtime event subscription.

### 4. Run Strict TypeScript Check
```bash
npm run typecheck
```

### 5. Run Production Build
```bash
npm run build
```

### 6. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
