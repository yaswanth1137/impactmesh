import React from 'react';

export type PixelIconType =
  | 'emblem-blacktide'
  | 'emblem-impactmesh'
  | 'helm'
  | 'compass'
  | 'spyglass'
  | 'anchor'
  | 'signal-flag'
  | 'route-marker'
  | 'gear'
  | 'ledger'
  | 'coin'
  | 'pressure-gauge'
  | 'lantern-green'
  | 'lantern-amber'
  | 'flare-red'
  | 'waypoint'
  | 'crosshair'
  | 'hazard';

interface PixelIconProps {
  name: PixelIconType;
  size?: number;
  className?: string;
  color?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 16,
  className = '',
  color = 'currentColor',
}) => {
  const renderIcon = () => {
    switch (name) {
      // 1. Blacktide Emblem: Pirate maritime crest with crown & crossed swords/compass
      case 'emblem-blacktide':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            {/* Crest crown & skull crest */}
            <rect x="6" y="1" width="4" height="1" fill="#D6A84F" />
            <rect x="5" y="2" width="6" height="1" fill="#D6A84F" />
            <rect x="4" y="3" width="8" height="1" fill="#E8E4D8" />
            <rect x="3" y="4" width="10" height="4" fill="#E8E4D8" />
            {/* Eyes */}
            <rect x="5" y="5" width="2" height="2" fill="#090B0F" />
            <rect x="9" y="5" width="2" height="2" fill="#090B0F" />
            {/* Teeth */}
            <rect x="5" y="8" width="6" height="2" fill="#E8E4D8" />
            <rect x="6" y="8" width="1" height="2" fill="#090B0F" />
            <rect x="9" y="8" width="1" height="2" fill="#090B0F" />
            {/* Crossed nautical bones */}
            <rect x="2" y="10" width="2" height="2" fill="#D6A84F" />
            <rect x="12" y="10" width="2" height="2" fill="#D6A84F" />
            <rect x="4" y="11" width="8" height="1" fill="#D6A84F" />
            <rect x="2" y="12" width="12" height="1" fill="#D6A84F" />
            <rect x="1" y="13" width="3" height="2" fill="#D6A84F" />
            <rect x="12" y="13" width="3" height="2" fill="#D6A84F" />
          </svg>
        );

      // 2. ImpactMesh Emblem: Connected decision mesh with central bearing
      case 'emblem-impactmesh':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            {/* Outer coordinate frame */}
            <rect x="1" y="1" width="3" height="1" fill="#557A91" />
            <rect x="1" y="1" width="1" height="3" fill="#557A91" />
            <rect x="12" y="1" width="3" height="1" fill="#557A91" />
            <rect x="14" y="1" width="1" height="3" fill="#557A91" />
            <rect x="1" y="14" width="3" height="1" fill="#557A91" />
            <rect x="1" y="12" width="1" height="3" fill="#557A91" />
            <rect x="12" y="14" width="3" height="1" fill="#557A91" />
            <rect x="14" y="12" width="1" height="3" fill="#557A91" />
            {/* Central decision node */}
            <rect x="7" y="6" width="2" height="4" fill="#D6A84F" />
            <rect x="6" y="7" width="4" height="2" fill="#D6A84F" />
            {/* Mesh connectors */}
            <rect x="3" y="4" width="2" height="2" fill="#AFCBC2" />
            <rect x="11" y="4" width="2" height="2" fill="#AFCBC2" />
            <rect x="3" y="10" width="2" height="2" fill="#AFCBC2" />
            <rect x="11" y="10" width="2" height="2" fill="#AFCBC2" />
            {/* Cross traces */}
            <rect x="5" y="5" width="2" height="1" fill="#2A333B" />
            <rect x="9" y="5" width="2" height="1" fill="#2A333B" />
            <rect x="5" y="10" width="2" height="1" fill="#2A333B" />
            <rect x="9" y="10" width="2" height="1" fill="#2A333B" />
          </svg>
        );

      // 3. Helm / Captain's Wheel (Command Deck)
      case 'helm':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="0" width="2" height="2" fill={color} />
            <rect x="7" y="14" width="2" height="2" fill={color} />
            <rect x="0" y="7" width="2" height="2" fill={color} />
            <rect x="14" y="7" width="2" height="2" fill={color} />
            {/* Rim ring */}
            <rect x="5" y="3" width="6" height="1" fill={color} />
            <rect x="5" y="12" width="6" height="1" fill={color} />
            <rect x="3" y="5" width="1" height="6" fill={color} />
            <rect x="12" y="5" width="1" height="6" fill={color} />
            {/* Center hub */}
            <rect x="6" y="6" width="4" height="4" fill="#D6A84F" />
            <rect x="7" y="7" width="2" height="2" fill="#090B0F" />
            {/* Spokes */}
            <rect x="7" y="2" width="2" height="4" fill={color} />
            <rect x="7" y="10" width="2" height="4" fill={color} />
            <rect x="2" y="7" width="4" height="2" fill={color} />
            <rect x="10" y="7" width="4" height="2" fill={color} />
          </svg>
        );

      // 4. Compass (Navigation / Chart Room)
      case 'compass':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="4" y="2" width="8" height="1" fill={color} />
            <rect x="4" y="13" width="8" height="1" fill={color} />
            <rect x="2" y="4" width="1" height="8" fill={color} />
            <rect x="13" y="4" width="1" height="8" fill={color} />
            {/* Corner curve pixels */}
            <rect x="3" y="3" width="1" height="1" fill={color} />
            <rect x="12" y="3" width="1" height="1" fill={color} />
            <rect x="3" y="12" width="1" height="1" fill={color} />
            <rect x="12" y="12" width="1" height="1" fill={color} />
            {/* North needle */}
            <rect x="7" y="4" width="2" height="3" fill="#D05A4A" />
            <rect x="7" y="7" width="2" height="1" fill="#D6A84F" />
            {/* South needle */}
            <rect x="7" y="8" width="2" height="4" fill="#AFCBC2" />
          </svg>
        );

      // 5. Spyglass / Telescope (Sales / The Lookout)
      case 'spyglass':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="11" y="2" width="4" height="3" fill="#D6A84F" />
            <rect x="12" y="1" width="2" height="1" fill="#D6A84F" />
            <rect x="8" y="5" width="4" height="3" fill="#C5B58F" />
            <rect x="5" y="8" width="4" height="3" fill="#A9ADA8" />
            <rect x="2" y="11" width="4" height="3" fill="#66727C" />
            <rect x="1" y="13" width="2" height="2" fill="#D6A84F" />
            {/* Lens flare tick */}
            <rect x="14" y="2" width="1" height="1" fill="#FFFFFF" />
          </svg>
        );

      // 6. Anchor (Business Course / Stability)
      case 'anchor':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="1" width="2" height="2" fill={color} />
            <rect x="6" y="2" width="4" height="1" fill={color} />
            <rect x="7" y="3" width="2" height="9" fill={color} />
            <rect x="3" y="5" width="10" height="2" fill={color} />
            <rect x="3" y="11" width="2" height="1" fill={color} />
            <rect x="11" y="11" width="2" height="1" fill={color} />
            <rect x="4" y="12" width="8" height="2" fill={color} />
            <rect x="2" y="9" width="1" height="3" fill={color} />
            <rect x="13" y="9" width="1" height="3" fill={color} />
          </svg>
        );

      // 7. Signal Flag (Events / Tactical Transmission)
      case 'signal-flag':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="2" y="1" width="2" height="14" fill="#66727C" />
            <rect x="4" y="2" width="9" height="6" fill="#D6A84F" />
            <rect x="6" y="4" width="5" height="2" fill="#090B0F" />
            <rect x="1" y="14" width="4" height="2" fill="#2A333B" />
          </svg>
        );

      // 8. Route Marker / FlowTrace Waypoint
      case 'route-marker':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="6" y="2" width="4" height="1" fill="#D6A84F" />
            <rect x="5" y="3" width="6" height="5" fill="#D6A84F" />
            <rect x="7" y="5" width="2" height="2" fill="#090B0F" />
            <rect x="6" y="8" width="4" height="2" fill="#D6A84F" />
            <rect x="7" y="10" width="2" height="3" fill="#D6A84F" />
            <rect x="6" y="13" width="4" height="1" fill="#C5B58F" />
          </svg>
        );

      // 9. Gear / Machinery (Operations / Engine Room)
      case 'gear':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="1" width="2" height="2" fill={color} />
            <rect x="7" y="13" width="2" height="2" fill={color} />
            <rect x="1" y="7" width="2" height="2" fill={color} />
            <rect x="13" y="7" width="2" height="2" fill={color} />
            {/* Diagonal teeth */}
            <rect x="3" y="3" width="2" height="2" fill={color} />
            <rect x="11" y="3" width="2" height="2" fill={color} />
            <rect x="3" y="11" width="2" height="2" fill={color} />
            <rect x="11" y="11" width="2" height="2" fill={color} />
            {/* Wheel rim */}
            <rect x="5" y="5" width="6" height="6" fill={color} />
            {/* Center axle hole */}
            <rect x="7" y="7" width="2" height="2" fill="#090B0F" />
          </svg>
        );

      // 10. Ledger (Finance / Treasury)
      case 'ledger':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="3" y="2" width="10" height="12" fill="#141A20" stroke="#2A333B" strokeWidth="1" />
            <rect x="2" y="2" width="2" height="12" fill="#D6A84F" />
            <rect x="5" y="4" width="6" height="1" fill="#A9ADA8" />
            <rect x="5" y="6" width="5" height="1" fill="#A9ADA8" />
            <rect x="5" y="8" width="6" height="1" fill="#A9ADA8" />
            <rect x="5" y="10" width="4" height="1" fill="#59A66A" />
          </svg>
        );

      // 11. Coin / Treasury
      case 'coin':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="5" y="2" width="6" height="1" fill="#D6A84F" />
            <rect x="4" y="3" width="8" height="10" fill="#D6A84F" />
            <rect x="5" y="13" width="6" height="1" fill="#D6A84F" />
            <rect x="3" y="5" width="10" height="6" fill="#D6A84F" />
            {/* Inset emblem */}
            <rect x="6" y="5" width="4" height="6" fill="#141A20" />
            <rect x="7" y="6" width="2" height="4" fill="#D6A84F" />
          </svg>
        );

      // 12. Pressure Gauge (Capacity / Risk)
      case 'pressure-gauge':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="4" y="2" width="8" height="1" fill={color} />
            <rect x="3" y="3" width="10" height="9" fill={color} />
            <rect x="4" y="12" width="8" height="1" fill={color} />
            <rect x="4" y="4" width="8" height="7" fill="#101419" />
            {/* Needle */}
            <rect x="6" y="8" width="4" height="1" fill="#D05A4A" />
            <rect x="9" y="6" width="2" height="2" fill="#D05A4A" />
          </svg>
        );

      // 13. Lanterns / Status Lights
      case 'lantern-green':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="6" y="2" width="4" height="1" fill="#2A333B" />
            <rect x="5" y="3" width="6" height="8" fill="#141A20" />
            <rect x="6" y="4" width="4" height="6" fill="#59A66A" />
            <rect x="7" y="5" width="2" height="4" fill="#FFFFFF" />
            <rect x="5" y="11" width="6" height="2" fill="#2A333B" />
          </svg>
        );

      case 'lantern-amber':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="6" y="2" width="4" height="1" fill="#2A333B" />
            <rect x="5" y="3" width="6" height="8" fill="#141A20" />
            <rect x="6" y="4" width="4" height="6" fill="#D6A84F" />
            <rect x="7" y="5" width="2" height="4" fill="#FFFFFF" />
            <rect x="5" y="11" width="6" height="2" fill="#2A333B" />
          </svg>
        );

      case 'flare-red':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="1" width="2" height="1" fill="#D05A4A" />
            <rect x="6" y="2" width="4" height="2" fill="#D05A4A" />
            <rect x="5" y="4" width="6" height="6" fill="#D05A4A" />
            <rect x="7" y="5" width="2" height="4" fill="#FFFFFF" />
            <rect x="6" y="10" width="4" height="4" fill="#2A333B" />
          </svg>
        );

      case 'waypoint':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="2" width="2" height="12" fill={color} />
            <rect x="2" y="7" width="12" height="2" fill={color} />
            <rect x="5" y="5" width="6" height="6" fill="#D6A84F" />
            <rect x="7" y="7" width="2" height="2" fill="#090B0F" />
          </svg>
        );

      case 'crosshair':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="1" width="2" height="4" fill={color} />
            <rect x="7" y="11" width="2" height="4" fill={color} />
            <rect x="1" y="7" width="4" height="2" fill={color} />
            <rect x="11" y="7" width="4" height="2" fill={color} />
            <rect x="7" y="7" width="2" height="2" fill="#D6A84F" />
          </svg>
        );

      case 'hazard':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} shapeRendering="crispEdges">
            <rect x="7" y="2" width="2" height="2" fill="#D05A4A" />
            <rect x="6" y="4" width="4" height="2" fill="#D05A4A" />
            <rect x="5" y="6" width="6" height="2" fill="#D05A4A" />
            <rect x="4" y="8" width="8" height="2" fill="#D05A4A" />
            <rect x="3" y="10" width="10" height="3" fill="#D05A4A" />
            <rect x="7" y="5" width="2" height="4" fill="#090B0F" />
            <rect x="7" y="10" width="2" height="2" fill="#090B0F" />
          </svg>
        );

      default:
        return null;
    }
  };

  return <span className="inline-flex items-center justify-center shrink-0">{renderIcon()}</span>;
};
