import React from 'react';

export type StatusLightColor = 'green' | 'amber' | 'red' | 'blue' | 'dim';

interface PixelStatusLightProps {
  color?: StatusLightColor;
  pulse?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const PixelStatusLight: React.FC<PixelStatusLightProps> = ({
  color = 'green',
  pulse = false,
  label,
  size = 'md',
  className = '',
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return 'bg-[#59A66A] shadow-[0_0_6px_#59A66A]';
      case 'amber':
        return 'bg-[#D6A84F] shadow-[0_0_6px_#D6A84F]';
      case 'red':
        return 'bg-[#D05A4A] shadow-[0_0_6px_#D05A4A]';
      case 'blue':
        return 'bg-[#6A91A8] shadow-[0_0_6px_#6A91A8]';
      case 'dim':
      default:
        return 'bg-[#475664]';
    }
  };

  const dim = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span
        className={`inline-block shrink-0 ${dim} ${getColorStyles()} ${
          pulse ? 'animate-pulse' : ''
        }`}
        style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}
      />
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#A9ADA8]">
          {label}
        </span>
      )}
    </div>
  );
};
