import React from 'react';

export type PixelBadgeVariant =
  | 'brass'
  | 'seaFoam'
  | 'danger'
  | 'warning'
  | 'info'
  | 'muted'
  | 'dark';

interface PixelBadgeProps {
  children: React.ReactNode;
  variant?: PixelBadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const PixelBadge: React.FC<PixelBadgeProps> = ({
  children,
  variant = 'brass',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'brass':
        return 'bg-[#231B0E] text-[#D6A84F] border-[#D6A84F]';
      case 'seaFoam':
        return 'bg-[#10201B] text-[#AFCBC2] border-[#AFCBC2]';
      case 'danger':
        return 'bg-[#261214] text-[#D05A4A] border-[#D05A4A]';
      case 'warning':
        return 'bg-[#292010] text-[#D6A84F] border-[#D6A84F]';
      case 'info':
        return 'bg-[#101D28] text-[#6A91A8] border-[#557A91]';
      case 'dark':
        return 'bg-[#101419] text-[#E8E4D8] border-[#2A333B]';
      case 'muted':
      default:
        return 'bg-[#141A20] text-[#66727C] border-[#2A333B]';
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[9px] leading-tight tracking-wider'
      : 'px-2 py-0.5 text-[10px] leading-tight tracking-wider';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-pixel uppercase border pixel-corners-sm select-none ${getColors()} ${sizeClasses} ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      {pulse && <span className="w-1.5 h-1.5 bg-current shrink-0" />}
      {children}
    </span>
  );
};
