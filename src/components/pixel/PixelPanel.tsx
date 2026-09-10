import React from 'react';

interface PixelPanelProps {
  title?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  coordinate?: string; // e.g. "NAV 42°N / DECK-01"
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: 'dark' | 'raised' | 'ink' | 'brass';
  hasDoubleBorder?: boolean;
}

export const PixelPanel: React.FC<PixelPanelProps> = ({
  title,
  subtitle,
  badge,
  headerAction,
  coordinate,
  children,
  className = '',
  bodyClassName = '',
  variant = 'dark',
  hasDoubleBorder = false,
}) => {
  const getBg = () => {
    switch (variant) {
      case 'raised':
        return 'bg-[#1A2128]';
      case 'ink':
        return 'bg-[#101419]';
      case 'brass':
        return 'bg-[#141A20] border-[#D6A84F]/60';
      case 'dark':
      default:
        return 'bg-[#141A20]';
    }
  };

  return (
    <div
      className={`relative border border-[#2A333B] pixel-shadow ${hasDoubleBorder ? 'pixel-border-double' : ''} ${getBg()} ${className}`}
    >
      {/* Corner crosshairs / tick markers */}
      <div className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-[#D6A84F] pointer-events-none" />
      <div className="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-[#D6A84F] pointer-events-none" />
      <div className="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-[#2A333B] pointer-events-none" />
      <div className="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-[#2A333B] pointer-events-none" />

      {/* Header bar if specified */}
      {(title || coordinate || badge || headerAction) && (
        <div className="px-3 py-2 border-b border-[#2A333B] bg-[#101419] flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {typeof title === 'string' ? (
              <h2 className="font-pixel text-xs tracking-wider text-[#E8E4D8] uppercase truncate flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D6A84F] inline-block" />
                {title}
              </h2>
            ) : (
              title
            )}
            {subtitle && (
              <span className="text-[10px] text-[#A9ADA8] font-mono hidden sm:inline">
                // {subtitle}
              </span>
            )}
            {badge}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {coordinate && (
              <span className="font-mono text-[9px] text-[#66727C] tracking-widest uppercase">
                [{coordinate}]
              </span>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* Body content */}
      <div className={`p-3 md:p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
