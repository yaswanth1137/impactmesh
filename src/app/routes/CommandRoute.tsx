import React, { useState, useEffect } from 'react';
import { DecisionAlert } from '../../components/decisions/DecisionAlert.tsx';
import { BusinessPositionStrip } from '../../components/business/BusinessPositionStrip.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { ImpactMap } from '../../components/impact-map/ImpactMap.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { BusinessCourse } from '../../components/course/BusinessCourse.tsx';
import { LiveEventStream } from '../../components/decisions/LiveEventStream.tsx';
import { realtimeSubscriptionManager } from '../../lib/realtime/subscription-manager.ts';
import type { DecisionEvent } from '../../types/events.ts';
import {
  MOCK_ENTITIES,
  MOCK_DEPENDENCIES,
  MOCK_EVENT_LOG,
  MOCK_ACTIVE_DECISION_EVENT,
  MOCK_IMPACT_RESULT,
  MOCK_DECISION_OPTIONS,
  MOCK_RECOMMENDATION,
} from '../../mocks/blacktide-mock.ts';

interface CommandRouteProps {
  onPlotRoute: () => void;
}

export const CommandRoute: React.FC<CommandRouteProps> = ({ onPlotRoute }) => {
  const [isSimulatingCascade, setIsSimulatingCascade] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt-scope-reduction');
  const [events, setEvents] = useState<any[]>(MOCK_EVENT_LOG);

  useEffect(() => {
    const unsubscribe = realtimeSubscriptionManager.onEvent((incomingEvent: DecisionEvent) => {
      setIsAnalyzing(true);

      const streamEvent = {
        id: incomingEvent.id,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        department: incomingEvent.department.toUpperCase(),
        department_code: incomingEvent.department,
        actor: incomingEvent.created_by,
        action: incomingEvent.event_type.replace(/_/g, ' ').toUpperCase(),
        severity: (incomingEvent.event_type.includes('cut') || incomingEvent.event_type.includes('delay') || incomingEvent.event_type.includes('budget')
          ? 'critical'
          : incomingEvent.event_type.includes('accepted')
          ? 'success'
          : 'warning') as 'critical' | 'warning' | 'success' | 'info',
        details: JSON.stringify(incomingEvent.payload),
      };

      setEvents((prev) => [streamEvent, ...prev]);

      if (incomingEvent.event_type === 'budget_changed') {
        const payload = incomingEvent.payload as any;
        const isCut = (payload?.new_budget ?? 0) <= 1100000;
        setIsSimulatingCascade(isCut);
      } else if (incomingEvent.event_type === 'deal_accepted') {
        setIsSimulatingCascade(true);
      }

      setTimeout(() => {
        setIsAnalyzing(false);
      }, 700);
    });

    return () => unsubscribe();
  }, []);

  const handleTriggerSimulation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsSimulatingCascade((prev) => !prev);
    }, 800);
  };

  const scrollToImpact = () => {
    const el = document.getElementById('impact-map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const affectedEntityIds = isSimulatingCascade
    ? MOCK_IMPACT_RESULT.affected_entities.map((e) => e.entity_id)
    : [];

  const topOption =
    MOCK_DECISION_OPTIONS.find((o) => o.id === selectedOptionId) ||
    MOCK_DECISION_OPTIONS[0];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* 1. DECISION ALERT: Top executive banner immediately below header */}
      <section>
        <DecisionAlert
          department="FINANCE"
          actionTitle="Budget reduced"
          changeDetail="₹18L → ₹11L"
          effectsCount={7}
          capacityDeficitHours={120}
          deliveryExposureDays={8}
          financialExposure="₹50L"
          onReviewImpact={scrollToImpact}
        />
      </section>

      {/* 2. BUSINESS POSITION: Concise executive 4-metric strip */}
      <section>
        <BusinessPositionStrip isSimulatingCascade={isSimulatingCascade} />
      </section>

      {/* 3. IMPACT SUMMARY: What changed, affected, at risk, financial exposure */}
      <section>
        <ImpactSummary
          event={MOCK_ACTIVE_DECISION_EVENT}
          impact={MOCK_IMPACT_RESULT}
        />
      </section>

      {/* 4. IMPACT MAP: What does this decision affect? */}
      <section id="impact-map-section">
        <ImpactMap
          entities={MOCK_ENTITIES}
          dependencies={MOCK_DEPENDENCIES}
          affectedEntityIds={affectedEntityIds}
          isAnalyzing={isAnalyzing}
          isSimulatingCascade={isSimulatingCascade}
          onTriggerSimulation={handleTriggerSimulation}
        />
      </section>

      {/* 5. DECISION ALTERNATIVES: What can we do? */}
      <section>
        <DecisionOptionList
          options={MOCK_DECISION_OPTIONS}
          selectedOptionId={selectedOptionId}
          onSelectOption={(opt) => setSelectedOptionId(opt.id)}
        />
      </section>

      {/* 6. RECOMMENDED COURSE: Visually dominant recommendation card */}
      <section>
        <RecommendationCard
          recommendation={MOCK_RECOMMENDATION}
          topOption={topOption}
          onPlotRoute={onPlotRoute}
          onSimulate={handleTriggerSimulation}
        />
      </section>

      {/* 7. BUSINESS COURSE: Secondary organizational trajectory */}
      <section>
        <BusinessCourse />
      </section>

      {/* 8. LIVE EVENT LOG: Secondary auditability stream */}
      <section>
        <LiveEventStream
          events={events}
          isAnalyzing={isAnalyzing}
        />
      </section>
    </div>
  );
};
