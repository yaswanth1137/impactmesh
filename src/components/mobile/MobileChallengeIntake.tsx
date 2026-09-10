import React, { useState } from 'react';
import { PixelBadge } from '../pixel/PixelBadge.tsx';
import { publishDecisionEvent } from '../../lib/realtime/channel-service.ts';
import { ENTERPRISE_OPERATOR } from '../../lib/auth/auth-service.ts';
import type { DeptRouteKey } from './MobileDepartmentSwitcher.tsx';
import type { ImpactMeshEventType } from '../../types/events.ts';

export interface ChallengePreset {
  id: string;
  department: DeptRouteKey;
  eventType: ImpactMeshEventType;
  title: string;
  description: string;
  metricType: 'capacity' | 'delivery' | 'budget' | 'scope' | 'inventory';
  metricValue: number;
  metricDisplay: string;
  severity: 'NORMAL' | 'TENSION' | 'RISK' | 'CRITICAL';
}

export const PRESET_CHALLENGES: ChallengePreset[] = [
  {
    id: 'preset-ops-outage',
    department: 'operations',
    eventType: 'capacity_changed',
    title: 'Critical Machine Breakdown & Labor Shortage',
    description: 'Robotic assembly line cell B offline and 30% shift reduction. Production capacity reduced to 210h (50% capacity).',
    metricType: 'capacity',
    metricValue: 210,
    metricDisplay: '210h (50% capacity, 210h deficit)',
    severity: 'CRITICAL',
  },
  {
    id: 'preset-ops-delay',
    department: 'operations',
    eventType: 'delivery_delay',
    title: 'Supply Chain Component Bottleneck',
    description: 'Tier-1 semiconductor supplier delayed shipment. Production schedule pushed back by 14 days.',
    metricType: 'delivery',
    metricValue: 14,
    metricDisplay: '+14 Days Delivery Slip',
    severity: 'RISK',
  },
  {
    id: 'preset-fin-freeze',
    department: 'finance',
    eventType: 'spending_freeze',
    title: 'Emergency Capex Contraction & Spend Freeze',
    description: 'Treasury contracted discretionary quarterly budget ceiling from ₹18,00,000 to ₹11,00,000 to defend 8-month runway.',
    metricType: 'budget',
    metricValue: 1100000,
    metricDisplay: '₹11.0L (-₹7.0L Contraction)',
    severity: 'CRITICAL',
  },
  {
    id: 'preset-sales-apex',
    department: 'sales',
    eventType: 'deal_accepted',
    title: 'Apex Global ₹50L Enterprise Deal Committed',
    description: 'Lookout closed ₹50,00,000 contract expansion committing custom SAML SSO and strict 30-day delivery SLA penalty.',
    metricType: 'scope',
    metricValue: 420,
    metricDisplay: '₹50.0L Contract / 420h Demand',
    severity: 'RISK',
  },
  {
    id: 'preset-prod-scope',
    department: 'product',
    eventType: 'feature_scope_changed',
    title: 'Unplanned Enterprise Scope Addition',
    description: 'Product backlog intake added 3 custom enterprise compliance reporting modules, adding +120h to sprint load.',
    metricType: 'scope',
    metricValue: 155,
    metricDisplay: '+120h Engineering Load (155 pts)',
    severity: 'TENSION',
  },
  {
    id: 'preset-comm-terms',
    department: 'commercial',
    eventType: 'commercial_terms_changed',
    title: 'Contractual SLA Penalty Clauses Activated',
    description: 'Apex Global terms tightened from Net 60 to Net 30 with 5% weekly liquidated damages for milestone slippage.',
    metricType: 'budget',
    metricValue: 500000,
    metricDisplay: 'Net 30 / ₹5L At Risk',
    severity: 'TENSION',
  },
];

interface MobileChallengeIntakeProps {
  currentDept?: DeptRouteKey;
  onSuccess?: () => void;
  className?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const MobileChallengeIntake: React.FC<MobileChallengeIntakeProps> = ({
  currentDept = 'operations',
  onSuccess,
  className = '',
  isModal = false,
  onClose,
}) => {
  // Form State
  const [selectedDept, setSelectedDept] = useState<DeptRouteKey>(currentDept);
  const [selectedEventType, setSelectedEventType] = useState<ImpactMeshEventType>('capacity_changed');
  const [title, setTitle] = useState<string>('Production Capacity Contraction');
  const [description, setDescription] = useState<string>(
    'Critical machine maintenance and unplanned labor shortage reducing available shift hours.'
  );
  const [metricType, setMetricType] = useState<'capacity' | 'delivery' | 'budget' | 'scope' | 'inventory'>('capacity');
  const [metricValue, setMetricValue] = useState<string>('300');
  const [severity, setSeverity] = useState<'NORMAL' | 'TENSION' | 'RISK' | 'CRITICAL'>('CRITICAL');

  // Submission State
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionStatus, setTransmissionStatus] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_CHALLENGES.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedDept(preset.department);
    setSelectedEventType(preset.eventType);
    setTitle(preset.title);
    setDescription(preset.description);
    setMetricType(preset.metricType);
    setMetricValue(preset.metricValue.toString());
    setSeverity(preset.severity);
  };

  const handleDeptChange = (dept: DeptRouteKey) => {
    setSelectedDept(dept);
    if (dept === 'operations') setSelectedEventType('capacity_changed');
    else if (dept === 'sales') setSelectedEventType('deal_accepted');
    else if (dept === 'finance') setSelectedEventType('budget_changed');
    else if (dept === 'product') setSelectedEventType('feature_scope_changed');
    else if (dept === 'commercial') setSelectedEventType('commercial_terms_changed');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setStatusMessage('Please enter a challenge title.');
      setTransmissionStatus('error');
      return;
    }

    setIsTransmitting(true);
    setTransmissionStatus(null);
    setStatusMessage('');

    const numericValue = parseFloat(metricValue) || 0;

    const payload: Record<string, any> = {
      department: selectedDept,
      challenge_title: title.trim(),
      challenge_description: description.trim(),
      severity,
      metric_type: metricType,
      metric_value: numericValue,
      notes: `${title}: ${description}`,
      reported_at: new Date().toISOString(),
    };

    if (metricType === 'capacity' || selectedEventType === 'capacity_changed') {
      payload.previous_capacity_hours = 420;
      payload.new_capacity_hours = numericValue;
      payload.production_capacity = Math.round((numericValue / 420) * 100);
      payload.engineering_capacity = numericValue;
      payload.team_id = `TEAM-${selectedDept.toUpperCase()}-CORE`;
    } else if (metricType === 'budget' || selectedEventType === 'budget_changed' || selectedEventType === 'spending_freeze') {
      payload.previous_budget = 1800000;
      payload.new_budget = numericValue;
      payload.discretionary_budget = numericValue;
      payload.spending_freeze = selectedEventType === 'spending_freeze';
    } else if (metricType === 'delivery' || selectedEventType === 'delivery_delay') {
      payload.delay_days = numericValue;
      payload.shipment_status = 'Delayed';
      payload.delivery_exposure_days = numericValue;
    } else if (selectedEventType === 'deal_accepted' || selectedEventType === 'deal_created') {
      payload.final_value = numericValue;
      payload.deal_value = numericValue;
      payload.deal_id = 'DEAL-CUSTOM-EXPANSION';
    } else if (selectedEventType === 'feature_scope_changed') {
      payload.feature_count = 3;
      payload.scope_hours = numericValue;
      payload.engineering_demand = 420;
    }

    try {
      const result = await publishDecisionEvent({
        organization_id: ENTERPRISE_OPERATOR.organizationId,
        department: selectedDept,
        event_type: selectedEventType,
        entity_id: `CHALLENGE-${selectedDept.toUpperCase()}-${Date.now().toString(36)}`,
        payload: payload as any,
        created_by: `${ENTERPRISE_OPERATOR.fullName} (${selectedDept.toUpperCase()})`,
      });

      if (result.success) {
        setTransmissionStatus('success');
        setStatusMessage(`BROADCASTED // CEO Command Deck updated with ${selectedDept.toUpperCase()} challenge`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (isModal && onClose) onClose();
        }, 1200);
      } else {
        setTransmissionStatus('error');
        setStatusMessage(result.error || 'Failed to transmit challenge');
      }
    } catch (err: any) {
      setTransmissionStatus('error');
      setStatusMessage(err?.message || 'Transmission network exception');
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div
      className={`bg-[#0D1217] border border-[#2A333B] text-[#E8E4D8] p-4 sm:p-5 shadow-2xl rounded-xs select-none ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2A333B]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
          <div>
            <div className="font-pixel text-[10px] text-[#D6A84F] tracking-widest uppercase">
              OPERATOR INTAKE CONSOLE
            </div>
            <h3 className="font-mono text-sm font-bold text-[#E8E4D8] uppercase tracking-tight">
              Report Department Challenge / Live Change
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PixelBadge variant="warning" size="sm">
            REALTIME BROADCAST
          </PixelBadge>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 bg-[#1A2128] hover:bg-[#252E37] text-[#A9ADA8] hover:text-[#E8E4D8] font-mono text-xs border border-[#2A333B] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {/* 1. QUICK PRESET SCENARIO SELECTOR */}
        <div>
          <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1.5 font-pixel">
            1. Select Preset Challenge (or customize below):
          </label>
          <select
            onChange={(e) => handleApplyPreset(e.target.value)}
            defaultValue=""
            className="w-full bg-[#141A20] border border-[#2A333B] text-[#E8E4D8] px-3 py-2 text-xs focus:border-[#D6A84F] outline-none"
          >
            <option value="" disabled>
              -- Select a Standard Challenge Scenario --
            </option>
            {PRESET_CHALLENGES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                [{preset.department.toUpperCase()}] {preset.title} ({preset.metricDisplay})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {PRESET_CHALLENGES.slice(0, 4).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className="px-2 py-1 bg-[#141A20] hover:bg-[#1E262F] border border-[#2A333B] hover:border-[#D6A84F] text-[10px] text-[#A9ADA8] hover:text-[#D6A84F] transition-colors cursor-pointer rounded-2xs"
              >
                + {p.title.split(' ')[0]} {p.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. DEPARTMENT & EVENT CATEGORY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
              2. Department:
            </label>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value as DeptRouteKey)}
              className="w-full bg-[#141A20] border border-[#2A333B] text-[#E8E4D8] px-3 py-2 text-xs focus:border-[#D6A84F] outline-none font-bold"
            >
              <option value="operations">OPERATIONS // The Engine Room</option>
              <option value="sales">SALES // The Lookout</option>
              <option value="commercial">COMMERCIAL // Accounts & Terms</option>
              <option value="finance">FINANCE // The Treasury</option>
              <option value="product">PRODUCT // The Chart Room</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
              3. Event Category:
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value as ImpactMeshEventType)}
              className="w-full bg-[#141A20] border border-[#2A333B] text-[#E8E4D8] px-3 py-2 text-xs focus:border-[#D6A84F] outline-none"
            >
              <option value="capacity_changed">capacity_changed (Staff/Machine)</option>
              <option value="delivery_delay">delivery_delay (Schedule Slip)</option>
              <option value="resource_unavailable">resource_unavailable (Breakdown)</option>
              <option value="budget_changed">budget_changed (Ceiling Delta)</option>
              <option value="spending_freeze">spending_freeze (Capex Freeze)</option>
              <option value="deal_accepted">deal_accepted (Customer Contract)</option>
              <option value="feature_scope_changed">feature_scope_changed (Backlog)</option>
              <option value="commercial_terms_changed">commercial_terms_changed (SLA/Net)</option>
            </select>
          </div>
        </div>

        {/* 3. TYPEABLE CHALLENGE TITLE */}
        <div>
          <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
            4. Challenge Headline (Typeable):
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Critical Machine Breakdown & Staff Shortage"
            className="w-full bg-[#141A20] border border-[#2A333B] focus:border-[#D6A84F] px-3 py-2 text-xs text-[#E8E4D8] outline-none"
          />
        </div>

        {/* 4. TYPEABLE SITUATION DETAILS */}
        <div>
          <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
            5. Situation Details & Rationale (Typeable):
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what occurred, root cause, and initial containment steps..."
            className="w-full bg-[#141A20] border border-[#2A333B] focus:border-[#D6A84F] p-2.5 text-xs text-[#E8E4D8] outline-none leading-relaxed"
          />
        </div>

        {/* 5. METRIC TYPE & VALUE INPUTS */}
        <div className="p-3 bg-[#141A20] border border-[#2A333B] space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
                6. Primary Impact Metric:
              </label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value as any)}
                className="w-full bg-[#0D1217] border border-[#2A333B] text-[#E8E4D8] px-2.5 py-1.5 text-xs outline-none focus:border-[#D6A84F]"
              >
                <option value="capacity">Production / Eng Hours (h)</option>
                <option value="delivery">Delivery Slip (Days)</option>
                <option value="budget">Budget Ceiling (₹ INR)</option>
                <option value="scope">Feature Scope Load (Hours)</option>
                <option value="inventory">Inventory On-Hand (Units)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
                7. New Metric Value:
              </label>
              <input
                type="number"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                className="w-full bg-[#0D1217] border border-[#2A333B] text-[#D6A84F] font-bold px-2.5 py-1.5 text-xs outline-none focus:border-[#D6A84F]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[10px]">
            <span className="text-[#6C727A]">Quick Values:</span>
            {metricType === 'capacity' && (
              <>
                <button
                  type="button"
                  onClick={() => setMetricValue('210')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  210h (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('300')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  300h (70%)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('420')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  420h (100%)
                </button>
              </>
            )}
            {metricType === 'delivery' && (
              <>
                <button
                  type="button"
                  onClick={() => setMetricValue('3')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('8')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  +8 Days
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('14')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  +14 Days
                </button>
              </>
            )}
            {metricType === 'budget' && (
              <>
                <button
                  type="button"
                  onClick={() => setMetricValue('800000')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  ₹8.0L
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('1100000')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  ₹11.0L
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('1800000')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  ₹18.0L
                </button>
              </>
            )}
            {(metricType === 'scope' || metricType === 'inventory') && (
              <>
                <button
                  type="button"
                  onClick={() => setMetricValue('80')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  80 (Reduced)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricValue('155')}
                  className="px-2 py-0.5 bg-[#1E262F] hover:bg-[#2A333B] text-[#E8E4D8] border border-[#2A333B]"
                >
                  155 (Full)
                </button>
              </>
            )}
          </div>
        </div>

        {/* 6. SEVERITY LEVEL */}
        <div>
          <label className="block text-[10px] text-[#A9ADA8] uppercase tracking-wider mb-1 font-pixel">
            8. Severity Level:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['NORMAL', 'TENSION', 'RISK', 'CRITICAL'] as const).map((lvl) => {
              const isSelected = severity === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-1.5 text-center text-[10px] font-pixel uppercase cursor-pointer border transition-all ${
                    isSelected
                      ? lvl === 'CRITICAL'
                        ? 'bg-[#C86150] text-[#FAF8F1] border-[#C86150] font-bold shadow-md'
                        : lvl === 'RISK'
                        ? 'bg-[#C89638] text-[#18201D] border-[#C89638] font-bold shadow-md'
                        : lvl === 'TENSION'
                        ? 'bg-[#B97B63] text-[#FAF8F1] border-[#B97B63] font-bold'
                        : 'bg-[#5B8D70] text-[#FAF8F1] border-[#5B8D70] font-bold'
                      : 'bg-[#141A20] text-[#A9ADA8] border-[#2A333B] hover:border-[#3E4954]'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-2.5 text-xs font-mono border ${
              transmissionStatus === 'success'
                ? 'bg-[#5B8D70]/10 border-[#5B8D70] text-[#5B8D70]'
                : 'bg-[#C86150]/10 border-[#C86150] text-[#C86150]'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* 7. SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isTransmitting}
          className={`w-full py-3 px-4 font-pixel text-xs tracking-wider uppercase cursor-pointer transition-all border shadow-lg flex items-center justify-center gap-2 ${
            isTransmitting
              ? 'bg-[#2A333B] text-[#A9ADA8] border-[#2A333B] cursor-not-allowed'
              : 'bg-[#D6A84F] hover:bg-[#E5B75E] text-[#090B0F] border-[#D6A84F] font-bold shadow-[#D6A84F]/20 active:scale-[0.99]'
          }`}
        >
          <span>{isTransmitting ? 'TRANSMITTING ACROSS MESH...' : '⚡ BROADCAST CHALLENGE TO COMMAND DECK'}</span>
        </button>
      </form>
    </div>
  );
};
