import React, { useState } from 'react';
import { BusinessPositionStrip } from '../../components/business/BusinessPositionStrip.tsx';
import { ImpactMap } from '../../components/impact-map/ImpactMap.tsx';
import { ImpactSummary } from '../../components/decisions/ImpactSummary.tsx';
import { RecommendationCard } from '../../components/decisions/RecommendationCard.tsx';
import { DecisionOptionList } from '../../components/decisions/DecisionOptionList.tsx';
import { LiveEventStream } from '../../components/decisions/LiveEventStream.tsx';
import { BusinessCourse } from '../../components/course/BusinessCourse.tsx';
import { CaptainLog } from '../../components/decisions/CaptainLog.tsx';
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

  const handleTriggerSimulation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsSimulatingCascade((prev) => !prev);
    }, 800);
  };

  const affectedEntityIds = isSimulatingCascade
    ? MOCK_IMPACT_RESULT.affected_entities.map((e) => e.entity_id)
    : [];

  const topOption =
    MOCK_DECISION_OPTIONS.find((o) => o.id === selectedOptionId) ||
    MOCK_DECISION_OPTIONS[0];

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* 1. TOP: Compact Tactical Business Position Strip */}
      <section className="w-full">
        <BusinessPositionStrip isSimulatingCascade={isSimulatingCascade} />
      </section>

      {/* 2. CENTERPIECE: Impact Map // Business Navigation Chart */}
      <section className="w-full">
        <ImpactMap
          entities={MOCK_ENTITIES}
          dependencies={MOCK_DEPENDENCIES}
          affectedEntityIds={affectedEntityIds}
          isAnalyzing={isAnalyzing}
          isSimulatingCascade={isSimulatingCascade}
          onTriggerSimulation={handleTriggerSimulation}
        />
      </section>

      {/* 3. DECISION & STRATEGIC REASONING GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Captain's Log, Decision Impact, and Ranked Alternatives (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <CaptainLog
            headline="NEW DECISION REQUIRES REVIEW // BUDGET CONTRACTION"
            entry="Finance reduced available capital allocation from ₹18.0L to ₹11.0L. The action immediately stresses platform engineering bandwidth and cascades into customer contract deadlines."
            summary="7 downstream effects detected across 4 operational tiers."
            onAction={handleTriggerSimulation}
            actionLabel={isSimulatingCascade ? '[ RESET SIMULATION ]' : '[ SIMULATE CASCADE ]'}
          />

          <ImpactSummary
            event={MOCK_ACTIVE_DECISION_EVENT}
            impact={MOCK_IMPACT_RESULT}
          />

          <DecisionOptionList
            options={MOCK_DECISION_OPTIONS}
            selectedOptionId={selectedOptionId}
            onSelectOption={(opt) => setSelectedOptionId(opt.id)}
          />
        </div>

        {/* Right Column: Strategic Recommendation & Live Event Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <RecommendationCard
            recommendation={MOCK_RECOMMENDATION}
            topOption={topOption}
            onPlotRoute={onPlotRoute}
            onSimulate={handleTriggerSimulation}
          />

          <LiveEventStream
            events={MOCK_EVENT_LOG}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </section>

      {/* 4. HISTORICAL TRAJECTORY: Business Course */}
      <section className="w-full">
        <BusinessCourse />
      </section>
    </div>
  );
};
