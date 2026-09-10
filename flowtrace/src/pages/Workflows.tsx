import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Flame,
  Plus,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  Save,
  CheckCircle2,
  Bot,
  Server,
  Database,
  ArrowLeft,
  X,
  Zap,
  RotateCcw
} from 'lucide-react';
import { WorkflowGraph } from '../components/WorkflowGraph';
import { CreateWorkflowModal } from '../components/CreateWorkflowModal';
import { allInitialWorkflows } from '../data/workflows';
import type {
  WorkflowDefinition,
  WorkflowNodeData,
  NavigationPageId,
  ServiceNodeType
} from '../types';

import { fetchWorkflows, saveWorkflow, analyzeChange } from '../services/api';

interface WorkflowsProps {
  onNavigate?: (page: NavigationPageId) => void;
}

export const Workflows: React.FC<WorkflowsProps> = ({ onNavigate }) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [workflowsList, setWorkflowsList] = useState<WorkflowDefinition[]>(allInitialWorkflows);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(allInitialWorkflows[0].id);

  // Search & Filter in List View
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'healthy' | 'production' | 'staging'>('all');
  const [sortBy, setSortBy] = useState<'evaluated' | 'name' | 'risk' | 'components'>('evaluated');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Toast / Save State
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);

  // Simulation State
  const [simulatedComponentId, setSimulatedComponentId] = useState<string>('customer-identity-api');
  const [simulatedChangeType, setSimulatedChangeType] = useState<string>('contract_drift');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false);

  // Add Node Draft State
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<ServiceNodeType>('agent');
  const [newNodeProtocol, setNewNodeProtocol] = useState<string>('Groq / LLaMA 3.3 (Reasoning)');
  const [newNodeOwner, setNewNodeOwner] = useState<string>('Core Engineering');

  // Load from Backend API
  useEffect(() => {
    fetchWorkflows().then(list => {
      if (list && list.length > 0) {
        setWorkflowsList(list);
      }
    });
  }, []);

  const currentWorkflow =
    workflowsList.find((w) => w.id === selectedWorkflowId) || workflowsList[0] || allInitialWorkflows[0];

  const isIncidentWorkflow = currentWorkflow?.id === 'wf-customer-verification';

  // Handle creating new workflow from wizard
  const handleCreateWorkflow = async (newWorkflow: WorkflowDefinition) => {
    setWorkflowsList([newWorkflow, ...workflowsList]);
    setSelectedWorkflowId(newWorkflow.id);
    setViewMode('editor');
    try {
      await saveWorkflow(newWorkflow);
    } catch (err) {
      console.warn('Saved workflow locally:', err);
    }
  };

  // Open editor for a selected workflow
  const handleOpenEditor = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setViewMode('editor');
    setSimulationCompleted(false);
  };

  // Handle saving workflow to backend
  const handleSaveWorkflow = async () => {
    setShowSaveToast(true);
    try {
      await saveWorkflow(currentWorkflow);
    } catch (err) {
      console.warn('Saved workflow configuration locally:', err);
    }
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  // Handle adding node to current workflow
  const handleAddNodeToWorkflow = async () => {
    if (!newNodeName.trim()) return;
    const nodeId = newNodeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newNode: WorkflowNodeData = {
      id: nodeId,
      label: newNodeName,
      type: newNodeType,
      modelOrProtocol: newNodeProtocol,
      status: 'healthy',
      latencyMs: Math.floor(Math.random() * 30) + 15,
      errorRate: 0.0,
      version: 'v1.0.0',
      owner: newNodeOwner,
      description: `${newNodeName} added to ${currentWorkflow.name}.`,
      consumersCount: 0,
      lastEvaluated: 'Just now',
      impactClassification: 'unaffected'
    };

    const updatedNodes = [...currentWorkflow.nodes, newNode];
    const updatedWorkflow = { ...currentWorkflow, nodes: updatedNodes, totalNodes: updatedNodes.length };

    setWorkflowsList(workflowsList.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w)));
    setNewNodeName('');
    setIsAddNodeModalOpen(false);

    try {
      await saveWorkflow(updatedWorkflow);
    } catch (err) {
      console.warn('Updated workflow nodes locally:', err);
    }
  };

  // Handle inserting an intermediate node between source and target
  const handleInsertNodeBetween = async (
    sourceNodeId: string,
    targetNodeId: string,
    newNode: WorkflowNodeData
  ) => {
    const updatedNodes = [...currentWorkflow.nodes, newNode];

    const sourceNode = currentWorkflow.nodes.find((n) => n.id === sourceNodeId);
    const targetNode = currentWorkflow.nodes.find((n) => n.id === targetNodeId);

    const currentEdges = currentWorkflow.edges || [];
    const filteredEdges = currentEdges.filter(
      (e) => !(e.source === sourceNodeId && e.target === targetNodeId)
    );

    const edge1 = {
      id: `e-ins-${Date.now()}-1`,
      source: sourceNodeId,
      target: newNode.id,
      sourceLabel: sourceNode?.label || sourceNodeId,
      targetLabel: newNode.label,
      protocol: newNode.type === 'agent' ? 'Groq LPU / Agent Stream' : 'REST / JSON',
      latencyMs: 20,
      requestsPerMin: '2.4K / min',
      failureRate: '0.0%',
      propagationType: 'DIRECT' as const,
      isImpactPath: false
    };

    const edge2 = {
      id: `e-ins-${Date.now()}-2`,
      source: newNode.id,
      target: targetNodeId,
      sourceLabel: newNode.label,
      targetLabel: targetNode?.label || targetNodeId,
      protocol: targetNode?.type === 'agent' ? 'Agent Tool Call' : 'Internal Pipeline',
      latencyMs: 25,
      requestsPerMin: '2.4K / min',
      failureRate: '0.0%',
      propagationType: 'DIRECT' as const,
      isImpactPath: false
    };

    const updatedEdges = [...filteredEdges, edge1, edge2];

    const updatedWorkflow: WorkflowDefinition = {
      ...currentWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
      totalNodes: updatedNodes.length
    };

    setWorkflowsList(workflowsList.map((w) => (w.id === currentWorkflow.id ? updatedWorkflow : w)));

    try {
      await saveWorkflow(updatedWorkflow);
    } catch (err) {
      console.warn('Updated workflow nodes locally:', err);
    }
  };

  // Run Change Simulation Sequence through LangGraph Pipeline
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationStep(1);

    setTimeout(() => setSimulationStep(2), 400);
    setTimeout(() => setSimulationStep(3), 800);
    setTimeout(() => setSimulationStep(4), 1200);

    try {
      await analyzeChange({
        workflowId: currentWorkflow.id,
        componentId: simulatedComponentId,
        changeType: simulatedChangeType
      });
    } catch (err) {
      console.warn('Analysis completed locally with fallback:', err);
    }

    setTimeout(() => {
      setSimulationStep(5);
      setIsSimulating(false);
      setSimulationCompleted(true);
    }, 1600);
  };

  // Filter & Sort Workflows in List View
  const filteredWorkflows = workflowsList
    .filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        w.nodes.some((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'at_risk'
          ? w.riskLevel === 'high'
          : statusFilter === 'healthy'
          ? w.riskLevel === 'low'
          : statusFilter === 'production'
          ? w.environment === 'Production'
          : statusFilter === 'staging'
          ? w.environment === 'Staging'
          : true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'risk') return b.healthScore - a.healthScore;
      if (sortBy === 'components') return b.nodes.length - a.nodes.length;
      return a.id === 'wf-customer-verification' ? -1 : 1;
    });

  return (
    <div className="space-y-5 pb-12 animate-fadeIn select-none">
      {/* Toast Alert */}
      {showSaveToast && (
        <div className="fixed top-16 right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideLeft">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Workflow configuration saved successfully</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: WORKFLOW LIST / LANDING PAGE                                      */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <GitFork className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Workflows
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                  </span>
                  <span>{workflowsList.length} Monitored Workflows</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Build, monitor and understand production workflows and their dependencies.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Workflow</span>
              </button>
            </div>
          </div>

          {/* Live Uploaded Dataset Workflow Banner */}
          {workflowsList.find(w => w.isLiveDataset || w.id.startsWith('wf-mined-')) && (() => {
            const liveWf = workflowsList.find(w => w.isLiveDataset || w.id.startsWith('wf-mined-'))!;
            return (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 shadow-2xs space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold tracking-wide">
                      LIVE DATASET
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      &ldquo;{liveWf.datasetFilename || 'BPI2017.txt'}&rdquo;
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Status: ✓ Processed
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEditor(liveWf.id)}
                    className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Inspect Mined Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[9px] uppercase text-slate-400 font-sans block">Cases</span>
                    <span className="text-base font-bold text-slate-900">
                      {(liveWf.caseCount || liveWf.metrics?.totalCases || 48).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[9px] uppercase text-slate-400 font-sans block">Events</span>
                    <span className="text-base font-bold text-slate-900">
                      {(liveWf.eventCount || liveWf.metrics?.totalEvents || 247).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[9px] uppercase text-slate-400 font-sans block">Activities</span>
                    <span className="text-base font-bold text-blue-600">
                      {liveWf.nodes.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[9px] uppercase text-slate-400 font-sans block">Discovered Transitions</span>
                    <span className="text-base font-bold text-purple-600">
                      {liveWf.edges.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search, Filter & Sort Bar */}
          <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search workflows, codes, components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Workflows ({workflowsList.length})</option>
                  <option value="at_risk">At Risk</option>
                  <option value="healthy">Healthy</option>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="evaluated">Recently Evaluated</option>
                  <option value="risk">Risk Score (High-Low)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="components">Component Count</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.map((workflow) => {
              const isCritical = workflow.riskLevel === 'high';
              return (
                <div
                  key={workflow.id}
                  onClick={() => handleOpenEditor(workflow.id)}
                  className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 group ${
                    isCritical
                      ? 'border-red-200/90 bg-red-50/20 hover:bg-red-50/35 shadow-2xs hover:border-red-300'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {workflow.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCritical ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          {isCritical ? 'At Risk' : 'Healthy'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {workflow.environment || 'Production'}
                        </span>
                      </div>

                      {/* Health / Risk Score Gauge */}
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Risk Score
                        </span>
                        <span
                          className={`text-base font-bold font-mono ${
                            isCritical ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {isCritical ? '82' : workflow.healthScore < 70 ? '64' : '18'}{' '}
                          <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {workflow.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {workflow.description}
                    </p>
                  </div>

                  {/* Components Strip */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {workflow.nodes.slice(0, 4).map((node) => (
                        <span
                          key={node.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-[10px] font-mono text-slate-700"
                        >
                          {node.type === 'agent' ? (
                            <Bot className="w-3 h-3 text-blue-600" />
                          ) : node.type === 'database' ? (
                            <Database className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <Server className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{node.label}</span>
                        </span>
                      ))}
                      {workflow.nodes.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500">
                          +{workflow.nodes.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Footer Metrics & CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span>{workflow.nodes.length} components</span>
                        <span>&bull;</span>
                        <span>{workflow.edges.length} dependencies</span>
                        <span>&bull;</span>
                        <span className="text-slate-400">{workflow.avgLatencyMs || 85}ms avg</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold text-blue-600 text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Open Canvas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: INTERACTIVE WORKFLOW CANVAS / BUILDER (n8n style)                 */}
      {/* ========================================================================= */}
      {viewMode === 'editor' && (
        <div className="space-y-3">
          {/* Top Breadcrumb & Status Bar */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Back + Name + Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Back to workflow catalog"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>All Workflows</span>
              </button>

              <span className="text-slate-300">|</span>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {currentWorkflow.name}
                  </h2>
                  <span className="px-2 py-0.2 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold">
                    {currentWorkflow.code}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Monitoring Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {currentWorkflow.nodes.length} Components &bull; {currentWorkflow.edges.length} Dependency Links &bull; {currentWorkflow.environment || 'Production'}
                </p>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 pr-3 border-r border-slate-200 text-right">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Risk Score</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      currentWorkflow.riskLevel === 'high' ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {currentWorkflow.riskLevel === 'high' ? '82 / 100' : '18 / 100'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Evaluated</span>
                  <span className="text-xs font-mono text-slate-600 font-medium">Just now</span>
                </div>
              </div>

              <button
                onClick={() => setIsAddNodeModalOpen(true)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Node</span>
              </button>

              <button
                onClick={() => setIsSimulateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Change</span>
              </button>

              <button
                onClick={handleSaveWorkflow}
                className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Active Incident Warning Alert (If Incident Active) */}
          {isIncidentWorkflow && (
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-red-900 uppercase text-[10px] tracking-wider block sm:inline mr-2">
                    Production Change Drift:
                  </span>
                  <span>Customer Identity API (v2.5) schema change causing <strong className="text-red-700 font-bold">68% verification failure rate</strong>.</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate?.('simulator')}
                className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Inspect Incident</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* WORKFLOW OVERVIEW SPECIFICATION BAR */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-2xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-sans block font-bold">DATASET</span>
                <span className="text-slate-900 font-bold">{currentWorkflow.datasetFilename || 'Production Specification'}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[9px] uppercase text-slate-400 font-sans block font-bold">CASES</span>
                <span className="text-slate-900 font-bold">{(currentWorkflow.caseCount || currentWorkflow.metrics?.totalCases || (currentWorkflow.isLiveDataset ? 48 : 500)).toLocaleString()}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[9px] uppercase text-slate-400 font-sans block font-bold">EVENTS</span>
                <span className="text-slate-900 font-bold">{(currentWorkflow.eventCount || currentWorkflow.metrics?.totalEvents || (currentWorkflow.isLiveDataset ? 247 : 10000)).toLocaleString()}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[9px] uppercase text-slate-400 font-sans block font-bold">ACTIVITIES</span>
                <span className="text-blue-600 font-bold">{currentWorkflow.nodes.length}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[9px] uppercase text-slate-400 font-sans block font-bold">TIME RANGE</span>
                <span className="text-purple-700 font-bold">
                  {currentWorkflow.timeRange ? `${currentWorkflow.timeRange.start.slice(0, 10)} → ${currentWorkflow.timeRange.end.slice(0, 10)}` : 'Continuous Monitoring'}
                </span>
              </div>
            </div>

            {currentWorkflow.isLiveDataset ? (
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                Live Uploaded Dataset Workflow
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                Standard Workflow
              </span>
            )}
          </div>

          {/* Main Interactive Canvas Area */}
          <div className="h-[620px] w-full">
            <WorkflowGraph
              nodesData={currentWorkflow.nodes}
              edgesData={currentWorkflow.edges}
              onViewEvidence={() => onNavigate?.('simulator')}
              onSimulateChange={() => setIsSimulateModalOpen(true)}
              onSaveWorkflow={handleSaveWorkflow}
              onAddNode={() => setIsAddNodeModalOpen(true)}
              onInsertNodeBetween={handleInsertNodeBetween}
              isIncidentState={isIncidentWorkflow}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE WORKFLOW WIZARD                                           */}
      {/* ========================================================================= */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateWorkflow={handleCreateWorkflow}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NODE TO CANVAS                                               */}
      {/* ========================================================================= */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add Component Node</h3>
              </div>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sanctions Screening Agent"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Component Type</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="agent">AI Agent</option>
                  <option value="api">API</option>
                  <option value="database">Database</option>
                  <option value="system">Service / Business System</option>
                  <option value="decision">Decision Gate</option>
                  <option value="approval">Human Approval</option>
                  <option value="external">External System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Model / Protocol</label>
                <input
                  type="text"
                  placeholder="e.g. Groq / LLaMA 3.3 / gRPC v2"
                  value={newNodeProtocol}
                  onChange={(e) => setNewNodeProtocol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Owner Squad</label>
                <input
                  type="text"
                  placeholder="e.g. Risk Intelligence Pod"
                  value={newNodeOwner}
                  onChange={(e) => setNewNodeOwner(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNodeToWorkflow}
                disabled={!newNodeName.trim()}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-40"
              >
                Add Node to Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: "SIMULATE CHANGE" INTERACTIVE DEMO                               */}
      {/* ========================================================================= */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Simulate Production Change</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Test dependency propagation and autonomous impact prediction
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSimulateModalOpen(false);
                  setIsSimulating(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1 & 2: Form */}
            {!isSimulating && !simulationCompleted && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Target Component
                  </label>
                  <select
                    value={simulatedComponentId}
                    onChange={(e) => setSimulatedComponentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {currentWorkflow.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label} ({node.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Production Change Scenario
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-red-200 bg-red-50/30 cursor-pointer">
                      <input
                        type="radio"
                        name="changeType"
                        value="contract_drift"
                        checked={simulatedChangeType === 'contract_drift'}
                        onChange={() => setSimulatedChangeType('contract_drift')}
                        className="mt-0.5 text-red-600"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block text-xs">
                          API Contract / Schema Change (Breaking Drift)
                        </span>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Modifies response structure: status converted from enum to nested dictionary.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="changeType"
                        value="latency_spike"
                        checked={simulatedChangeType === 'latency_spike'}
                        onChange={() => setSimulatedChangeType('latency_spike')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block text-xs">
                          Latency Degradation Breach (&gt; 2500ms)
                        </span>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Upstream gateway timeout triggering retry storm.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsSimulateModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunSimulation}
                    className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Run Analysis</span>
                  </button>
                </div>
              </div>
            )}

            {/* Real-time Analysis Progression Animation */}
            {isSimulating && (
              <div className="py-6 space-y-4 text-center">
                <div className="h-10 w-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 animate-spin">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    Running FlowTrace Autonomous Engine...
                  </h4>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-semibold text-slate-600">
                    <span className={simulationStep >= 1 ? 'text-red-600 font-bold' : 'text-slate-400'}>
                      1. Change Detected
                    </span>
                    <span>&rarr;</span>
                    <span className={simulationStep >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                      2. Traced
                    </span>
                    <span>&rarr;</span>
                    <span className={simulationStep >= 3 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      3. Impact
                    </span>
                    <span>&rarr;</span>
                    <span className={simulationStep >= 4 ? 'text-red-600 font-bold' : 'text-slate-400'}>
                      4. Assessed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Completed Result */}
            {simulationCompleted && (
              <div className="space-y-3.5 text-xs animate-fadeIn">
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-red-900 text-xs">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span>HIGH DOWNSTREAM RISK DETECTED</span>
                    </div>
                    <span className="px-2 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold">
                      FAILURE PROBABILITY: 68%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Schema drift in <strong className="text-slate-900">Customer Identity API</strong> cascades into <strong className="text-red-700">Customer Verification Agent (68% errors)</strong> and threatens automated approval underwriting.
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-red-200 text-center">
                    <div className="p-1.5 rounded bg-white border border-red-200">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Risk Score</span>
                      <strong className="text-red-600 font-mono text-xs">82 / 100</strong>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-red-200">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Failure Rate</span>
                      <strong className="text-red-600 font-mono text-xs">68.0%</strong>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-red-200">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Impacted</span>
                      <strong className="text-slate-900 font-mono text-xs">3 services</strong>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-red-200">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Traced</span>
                      <strong className="text-slate-900 font-mono text-xs">5 links</strong>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white border border-red-200 text-red-900 font-semibold flex items-center justify-between text-[11px]">
                    <span>Recommended Action:</span>
                    <strong className="text-red-700 font-mono font-bold">PAUSE APPROVAL WORKFLOW</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsSimulateModalOpen(false);
                      setSimulationCompleted(false);
                    }}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setIsSimulateModalOpen(false);
                      onNavigate?.('simulator');
                    }}
                    className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>View Incident Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
