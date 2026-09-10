import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface DarkCardNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  metric: string;
  department: string;
  status: 'normal' | 'affected' | 'critical' | 'source';
  isSelected?: boolean;
}

export const DarkCardNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as DarkCardNodeData;
  const isCritical = nodeData.status === 'critical';
  const isAffected = nodeData.status === 'affected';
  const isSource = nodeData.status === 'source';
  const isSelected = selected || nodeData.isSelected;

  // Department color accent bar
  const getDeptColor = (dept: string) => {
    switch (dept?.toLowerCase()) {
      case 'sales':
        return '#718894';
      case 'product':
        return '#6F8F87';
      case 'engineering':
      case 'operations':
        return '#C89638';
      case 'finance':
        return '#B97B63';
      default:
        return '#C89638';
    }
  };

  const deptColor = getDeptColor(nodeData.department);

  return (
    <div
      className={`min-w-[170px] max-w-[210px] bg-[#18201D] text-[#FAF8F1] rounded-xs transition-all shadow-md cursor-grab active:cursor-grabbing border ${
        isSelected
          ? 'border-[#C89638] ring-2 ring-[#C89638]/60 scale-[1.03]'
          : isCritical
          ? 'border-[#C86150] shadow-[#C86150]/20'
          : isSource || isAffected
          ? 'border-[#C89638]/70 hover:border-[#C89638]'
          : 'border-[#2D3834] hover:border-[#4B5E57]'
      }`}
      style={{ imageRendering: 'crisp-edges' }}
    >
      {/* Invisible Handles on left and right for clean horizontal DAG connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#C89638] !border !border-[#18201D] !rounded-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#C89638] !border !border-[#18201D] !rounded-none"
      />

      {/* Top Department Color Accent Indicator */}
      <div
        className="h-1 w-full rounded-t-xs"
        style={{
          backgroundColor: isCritical ? '#C86150' : isSource || isSelected ? '#C89638' : deptColor,
        }}
      />

      <div className="p-2.5 space-y-1">
        {/* Node Type & Department Pill */}
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono uppercase tracking-wider">
          <span className="text-[#AFCBC2] font-semibold">
            {nodeData.type}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded-2xs font-bold ${
              isCritical
                ? 'bg-[#C86150]/20 text-[#F87171]'
                : isSource
                ? 'bg-[#C89638]/20 text-[#E0AB48]'
                : 'text-[#889B95]'
            }`}
          >
            {nodeData.department}
          </span>
        </div>

        {/* Node Name */}
        <div className="font-sans font-bold text-xs text-[#FAF8F1] truncate tracking-tight" title={nodeData.name}>
          {nodeData.name}
        </div>

        {/* One Key Metric / Status */}
        {nodeData.metric && (
          <div
            className={`text-[10px] font-mono font-medium pt-0.5 border-t border-[#2D3834] flex items-center justify-between ${
              isCritical
                ? 'text-[#F87171]'
                : isSource || isAffected
                ? 'text-[#E0AB48]'
                : 'text-[#AFCBC2]'
            }`}
          >
            <span className="truncate">{nodeData.metric}</span>
            {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-[#C86150] animate-pulse shrink-0 ml-1" />}
          </div>
        )}
      </div>
    </div>
  );
});

DarkCardNode.displayName = 'DarkCardNode';
