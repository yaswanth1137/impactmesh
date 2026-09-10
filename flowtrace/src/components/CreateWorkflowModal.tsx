import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  Bot,
  Server,
  Database,
  Building2,
  Globe,
  Radio,
  CheckCircle2
} from 'lucide-react';
import type { WorkflowDefinition, WorkflowNodeData, ServiceNodeType } from '../types';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkflow: (workflow: WorkflowDefinition) => void;
}

interface ComponentDraft {
  id: string;
  name: string;
  type: ServiceNodeType;
  modelOrProtocol: string;
  owner: string;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkflow
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1 Form
  const [workflowName, setWorkflowName] = useState<string>('Treasury Liquidity & Settlement');
  const [workflowCode, setWorkflowCode] = useState<string>('WF-TLS-05');
  const [description, setDescription] = useState<string>(
    'Automated multi-agent liquidity verification, OFAC compliance check, and core banking SWIFT/Fedwire settlement dispatch.'
  );
  const [owner, setOwner] = useState<string>('Treasury Engineering');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Canary'>('Production');

  // Step 2 Components
  const [components, setComponents] = useState<ComponentDraft[]>([
    {
      id: 'liquidity-agent',
      name: 'Liquidity Verification Agent',
      type: 'agent',
      modelOrProtocol: 'Groq / LLaMA 3.3 (Reasoning)',
      owner: 'Treasury Engineering'
    },
    {
      id: 'ledger-api',
      name: 'Core Ledger REST API',
      type: 'api',
      modelOrProtocol: 'REST / JSON (v3.1)',
      owner: 'Ledger Infra'
    },
    {
      id: 'compliance-agent',
      name: 'OFAC & Sanctions Agent',
      type: 'agent',
      modelOrProtocol: 'Groq / LLaMA Guard',
      owner: 'Compliance AI'
    },
    {
      id: 'swift-gateway',
      name: 'SWIFT Settlement Gateway',
      type: 'system',
      modelOrProtocol: 'ISO 20022 gRPC',
      owner: 'Banking Gateway'
    }
  ]);

  const [newComponentName, setNewComponentName] = useState<string>('');
  const [newComponentType, setNewComponentType] = useState<ServiceNodeType>('agent');
  const [newComponentProtocol, setNewComponentProtocol] = useState<string>('Groq / LLaMA 3.1 Instant');

  // Step 3 Connections (fromId -> toId)
  const [connections, setConnections] = useState<[string, string][]>([
    ['liquidity-agent', 'ledger-api'],
    ['ledger-api', 'compliance-agent'],
    ['compliance-agent', 'swift-gateway']
  ]);

  if (!isOpen) return null;

  const handleAddComponent = () => {
    if (!newComponentName.trim()) return;
    const id = newComponentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setComponents([
      ...components,
      {
        id,
        name: newComponentName,
        type: newComponentType,
        modelOrProtocol: newComponentProtocol,
        owner
      }
    ]);
    setNewComponentName('');
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
    setConnections(connections.filter(([from, to]) => from !== id && to !== id));
  };

  const handleToggleConnection = (fromId: string, toId: string) => {
    const exists = connections.some(([from, to]) => from === fromId && to === toId);
    if (exists) {
      setConnections(connections.filter(([from, to]) => !(from === fromId && to === toId)));
    } else {
      setConnections([...connections, [fromId, toId]]);
    }
  };

  const handleFinish = () => {
    const nodes: WorkflowNodeData[] = components.map((c) => ({
      id: c.id,
      label: c.name,
      type: c.type,
      modelOrProtocol: c.modelOrProtocol,
      status: 'healthy',
      latencyMs: Math.floor(Math.random() * 40) + 20,
      errorRate: 0.0,
      version: 'v1.0.0',
      owner: c.owner,
      description: `${c.name} monitored within nominal latency and schema bounds.`,
      consumersCount: connections.filter(([from]) => from === c.id).length,
      lastEvaluated: 'Just now',
      impactClassification: 'unaffected'
    }));

    const edges = connections.map(([from, to], i) => ({
      id: `e-new-${i}`,
      source: from,
      target: to,
      sourceLabel: components.find((c) => c.id === from)?.name,
      targetLabel: components.find((c) => c.id === to)?.name,
      protocol: 'Internal gRPC / REST',
      latencyMs: 18,
      requestsPerMin: '12.4K / min',
      failureRate: '0.0%',
      propagationType: 'DIRECT' as const
    }));

    const newWorkflow: WorkflowDefinition = {
      id: workflowCode.toLowerCase(),
      name: workflowName,
      code: workflowCode,
      environment,
      description,
      healthScore: 99,
      riskLevel: 'low',
      totalNodes: nodes.length,
      avgLatencyMs: 45,
      nodes,
      edges
    };

    onCreateWorkflow(newWorkflow);
    onClose();
  };

  const getComponentIcon = (type: ServiceNodeType) => {
    switch (type) {
      case 'agent':
        return <Bot className="w-3.5 h-3.5 text-blue-600" />;
      case 'api':
      case 'tool':
        return <Server className="w-3.5 h-3.5 text-amber-600" />;
      case 'database':
        return <Database className="w-3.5 h-3.5 text-indigo-600" />;
      case 'stream':
        return <Radio className="w-3.5 h-3.5 text-emerald-600" />;
      case 'external':
        return <Globe className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Create Workflow
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Configure AI agents, API dependencies, and continuous reliability tracing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Strip */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'text-blue-700 font-bold' : ''}>
              Workflow Info
            </span>
          </div>
          <span className="text-slate-300">&rarr;</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'text-blue-700 font-bold' : ''}>
              Add Components
            </span>
          </div>
          <span className="text-slate-300">&rarr;</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className={step === 3 ? 'text-blue-700 font-bold' : ''}>
              Connect Dependencies
            </span>
          </div>
          <span className="text-slate-300">&rarr;</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              4
            </span>
            <span className={step === 4 ? 'text-blue-700 font-bold' : ''}>
              Review &amp; Onboard
            </span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {/* STEP 1: WORKFLOW INFO */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Treasury Liquidity & Settlement"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Identifier Code
                  </label>
                  <input
                    type="text"
                    value={workflowCode}
                    onChange={(e) => setWorkflowCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="WF-TLS-05"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Canary">Canary</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Owner Squad
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Treasury Engineering"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Describe end-to-end execution goals..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: ADD COMPONENTS */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-[11px]">
                  Configured Workflow Nodes ({components.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Supported: AI Agent, API, Database, Business System, External Service, Event Stream
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-2 rounded-md border border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-white border border-slate-200 flex items-center justify-center">
                        {getComponentIcon(comp.type)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{comp.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {comp.modelOrProtocol} &bull; {comp.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveComponent(comp.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Component Strip */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">
                  Add Component Node
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Component Name..."
                    value={newComponentName}
                    onChange={(e) => setNewComponentName(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={newComponentType}
                    onChange={(e) => setNewComponentType(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="agent">AI Agent</option>
                    <option value="api">API</option>
                    <option value="database">Database</option>
                    <option value="system">Business System</option>
                    <option value="external">External Service</option>
                    <option value="stream">Event Stream</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Protocol / Model..."
                    value={newComponentProtocol}
                    onChange={(e) => setNewComponentProtocol(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddComponent}
                  disabled={!newComponentName.trim()}
                  className="px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Node to Workflow</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONNECT DEPENDENCIES */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-[11px]">
                  Dependency Propagation Matrix
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Toggle links to build workflow DAG
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Connect upstream telemetry and contract dependencies to downstream reasoning agents:
              </p>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {components.map((fromComp) => (
                  <div key={fromComp.id} className="p-2.5 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      {getComponentIcon(fromComp.type)}
                      <span>{fromComp.name} &rarr; propagates to:</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pl-3">
                      {components
                        .filter((toComp) => toComp.id !== fromComp.id)
                        .map((toComp) => {
                          const isConnected = connections.some(
                            ([from, to]) => from === fromComp.id && to === toComp.id
                          );
                          return (
                            <button
                              key={toComp.id}
                              onClick={() => handleToggleConnection(fromComp.id, toComp.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                isConnected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {isConnected && <Check className="w-2.5 h-2.5" />}
                              <span>{toComp.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CREATE */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    {workflowName}
                  </span>
                  <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                    {environment}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {description}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Identifier</span>
                    <span className="font-mono font-bold text-xs">{workflowCode}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Components</span>
                    <span className="font-bold text-xs">{components.length} nodes</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Traced Links</span>
                    <span className="font-bold text-xs">{connections.length} dependencies</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Continuous background contract observation and automated impact prediction will be enabled immediately.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-blue-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Workflow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

