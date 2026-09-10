import React from 'react';

export type CharacterRole = 'captain' | 'lookout' | 'navigator' | 'engineer' | 'purser';

interface PixelCharacterProps {
  role: CharacterRole;
  size?: number; // e.g. 36 for compact, 96 for header
  className?: string;
  showTitle?: boolean;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  role,
  size = 48,
  className = '',
  showTitle = false,
}) => {
  const getRoleInfo = () => {
    switch (role) {
      case 'captain':
        return {
          title: 'CAPTAIN',
          department: 'COMMAND CENTER',
          subtitle: 'Operational Commander',
          accent: '#D6A84F',
        };
      case 'lookout':
        return {
          title: 'LOOKOUT',
          department: 'SALES & CRM',
          subtitle: 'Commercial Horizons',
          accent: '#D6A84F',
        };
      case 'navigator':
        return {
          title: 'NAVIGATOR',
          department: 'PRODUCT MANAGEMENT',
          subtitle: 'Course & Chart Plotter',
          accent: '#557A91',
        };
      case 'engineer':
        return {
          title: 'ENGINEER',
          department: 'ENGINEERING & OPS',
          subtitle: 'Machinery & Capacity Master',
          accent: '#C5B58F',
        };
      case 'purser':
        return {
          title: 'PURSER',
          department: 'FINANCE & TREASURY',
          subtitle: 'Treasury & Ledger Keeper',
          accent: '#59A66A',
        };
    }
  };

  const info = getRoleInfo();

  // Render authentic 24x24 pixel art portraits
  const renderPixelPortrait = () => {
    switch (role) {
      // 1. CAPTAIN: Command coat, brass epaulets, maritime peaked officer cap with gold crest
      case 'captain':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
            {/* Background subtle plate */}
            <rect x="0" y="0" width="24" height="24" fill="#101419" />
            <rect x="0" y="0" width="24" height="24" fill="none" stroke="#2A333B" strokeWidth="1" />

            {/* Captain's Peaked Cap Crown */}
            <rect x="7" y="2" width="10" height="2" fill="#090B0F" />
            <rect x="6" y="4" width="12" height="2" fill="#141A20" />
            {/* Gold Crest */}
            <rect x="11" y="4" width="2" height="2" fill="#D6A84F" />
            {/* Visor / Brim */}
            <rect x="5" y="6" width="14" height="1" fill="#090B0F" />
            <rect x="6" y="7" width="12" height="1" fill="#2A333B" />

            {/* Face & Complexion */}
            <rect x="8" y="8" width="8" height="6" fill="#C5B58F" />
            {/* Stern Eyes */}
            <rect x="9" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="13" y="10" width="2" height="1" fill="#090B0F" />
            {/* Eyebrows */}
            <rect x="9" y="9" width="2" height="1" fill="#66727C" />
            <rect x="13" y="9" width="2" height="1" fill="#66727C" />
            {/* Nose & Beard / Stubble */}
            <rect x="11" y="11" width="2" height="1" fill="#A9ADA8" />
            <rect x="8" y="13" width="8" height="2" fill="#2A333B" />
            <rect x="9" y="14" width="6" height="1" fill="#3F4A54" />

            {/* High Collar & Brass Epaulet Coat */}
            <rect x="7" y="15" width="10" height="2" fill="#E8E4D8" />
            <rect x="11" y="15" width="2" height="2" fill="#090B0F" />
            {/* Coat Body (Navy Deep Sea) */}
            <rect x="4" y="17" width="16" height="7" fill="#141A20" />
            {/* Gold Epaulets & Buttons */}
            <rect x="5" y="17" width="3" height="1" fill="#D6A84F" />
            <rect x="16" y="17" width="3" height="1" fill="#D6A84F" />
            <rect x="11" y="18" width="2" height="1" fill="#D6A84F" />
            <rect x="11" y="21" width="2" height="1" fill="#D6A84F" />
          </svg>
        );

      // 2. LOOKOUT: Peaked watch cap, spyglass at shoulder, vigilant gaze
      case 'lookout':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
            <rect x="0" y="0" width="24" height="24" fill="#101419" />
            <rect x="0" y="0" width="24" height="24" fill="none" stroke="#2A333B" strokeWidth="1" />

            {/* Watch Beanie / Wool Cap */}
            <rect x="8" y="2" width="8" height="2" fill="#231B0E" />
            <rect x="7" y="4" width="10" height="3" fill="#382B14" />
            <rect x="6" y="7" width="12" height="1" fill="#D6A84F" />

            {/* Face */}
            <rect x="8" y="8" width="8" height="6" fill="#C5B58F" />
            {/* Sharp Looking Eyes */}
            <rect x="10" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="14" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="10" y="9" width="2" height="1" fill="#382B14" />
            <rect x="14" y="9" width="2" height="1" fill="#382B14" />
            <rect x="11" y="12" width="2" height="1" fill="#A9ADA8" />

            {/* Brass Spyglass Slung Across Shoulder */}
            <rect x="3" y="13" width="3" height="2" fill="#D6A84F" />
            <rect x="4" y="15" width="2" height="5" fill="#E5BC68" />
            <rect x="5" y="20" width="2" height="3" fill="#D6A84F" />

            {/* Lookout Weather Smock */}
            <rect x="6" y="15" width="13" height="9" fill="#1C242C" />
            <rect x="8" y="14" width="8" height="2" fill="#D6A84F" />
          </svg>
        );

      // 3. NAVIGATOR: Spectacles/monocle, chart room sweater, dividers/compass
      case 'navigator':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
            <rect x="0" y="0" width="24" height="24" fill="#101419" />
            <rect x="0" y="0" width="24" height="24" fill="none" stroke="#2A333B" strokeWidth="1" />

            {/* Trim Hair */}
            <rect x="8" y="3" width="8" height="2" fill="#2A333B" />
            <rect x="7" y="5" width="10" height="3" fill="#3F4A54" />

            {/* Face */}
            <rect x="8" y="7" width="8" height="7" fill="#C5B58F" />
            {/* Spectacles / Monocle Frame */}
            <rect x="9" y="9" width="3" height="3" fill="none" stroke="#557A91" strokeWidth="1" />
            <rect x="13" y="9" width="3" height="3" fill="none" stroke="#557A91" strokeWidth="1" />
            <rect x="12" y="10" width="1" height="1" fill="#557A91" />
            <rect x="10" y="10" width="1" height="1" fill="#090B0F" />
            <rect x="14" y="10" width="1" height="1" fill="#090B0F" />

            {/* Chart Room Woolen Collar */}
            <rect x="7" y="15" width="10" height="2" fill="#557A91" />
            <rect x="9" y="14" width="6" height="2" fill="#E8E4D8" />
            <rect x="5" y="17" width="14" height="7" fill="#1A2128" />
            {/* Chart Roll tucked in arm */}
            <rect x="17" y="16" width="3" height="8" fill="#E8E4D8" />
            <rect x="18" y="18" width="1" height="6" fill="#D6A84F" />
          </svg>
        );

      // 4. ENGINEER: Work visor, grease mark, heavy industrial collar, mechanic wrench
      case 'engineer':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
            <rect x="0" y="0" width="24" height="24" fill="#101419" />
            <rect x="0" y="0" width="24" height="24" fill="none" stroke="#2A333B" strokeWidth="1" />

            {/* Protective Engine Visor / Flat Cap */}
            <rect x="7" y="3" width="10" height="2" fill="#2A2315" />
            <rect x="6" y="5" width="12" height="2" fill="#3D321D" />
            <rect x="5" y="7" width="14" height="1" fill="#C5B58F" />

            {/* Face */}
            <rect x="8" y="8" width="8" height="6" fill="#BFAF8C" />
            {/* Focused Eyes */}
            <rect x="9" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="13" y="10" width="2" height="1" fill="#090B0F" />
            {/* Smudge / Work Stubble */}
            <rect x="12" y="11" width="2" height="1" fill="#3F4A54" />
            <rect x="8" y="13" width="8" height="2" fill="#3D321D" />

            {/* Heavy Boiler Suit / Workwear */}
            <rect x="6" y="15" width="12" height="2" fill="#2A2315" />
            <rect x="4" y="17" width="16" height="7" fill="#1C242C" />
            {/* Industrial Brass Buckles */}
            <rect x="7" y="18" width="2" height="2" fill="#C5B58F" />
            <rect x="15" y="18" width="2" height="2" fill="#C5B58F" />
          </svg>
        );

      // 5. PURSER: High stiff ledger collar, counting spectacles, dark green velvet vest
      case 'purser':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
            <rect x="0" y="0" width="24" height="24" fill="#101419" />
            <rect x="0" y="0" width="24" height="24" fill="none" stroke="#2A333B" strokeWidth="1" />

            {/* Severe Hair Style */}
            <rect x="8" y="3" width="8" height="2" fill="#1C242C" />
            <rect x="7" y="5" width="10" height="3" fill="#2A333B" />

            {/* Face */}
            <rect x="8" y="7" width="8" height="7" fill="#C5B58F" />
            {/* Strict Counting Eyes */}
            <rect x="9" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="13" y="10" width="2" height="1" fill="#090B0F" />
            <rect x="9" y="9" width="2" height="1" fill="#1C242C" />
            <rect x="13" y="9" width="1" height="1" fill="#1C242C" />

            {/* High White Ledger Collar */}
            <rect x="8" y="14" width="8" height="2" fill="#E8E4D8" />
            <rect x="11" y="15" width="2" height="3" fill="#090B0F" />

            {/* Dark Green Treasury Vest */}
            <rect x="5" y="17" width="14" height="7" fill="#121F18" />
            {/* Gold Seal / Watch Chain */}
            <rect x="8" y="19" width="4" height="1" fill="#59A66A" />
            <rect x="10" y="20" width="1" height="2" fill="#D6A84F" />
          </svg>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className="shrink-0 p-0.5 bg-[#090B0F] border border-[#2A333B] shadow-sm">
        {renderPixelPortrait()}
      </div>

      {showTitle && (
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 inline-block"
              style={{ backgroundColor: info.accent }}
            />
            <span
              className="font-pixel text-xs tracking-wider"
              style={{ color: info.accent }}
            >
              {info.title}
            </span>
          </div>
          <div className="font-mono text-[11px] font-bold text-[#E8E4D8]">
            {info.department}
          </div>
          <div className="font-sans text-[10px] text-[#A9ADA8]">
            {info.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};
