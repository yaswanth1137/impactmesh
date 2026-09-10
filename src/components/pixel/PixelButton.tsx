import React from 'react';

export type PixelButtonVariant =
  | 'primary'   // Blacktide Brass
  | 'secondary' // Raised Dark Panel
  | 'danger'    // Critical / Red
  | 'ghost'     // Minimal Borderless
  | 'outline';   // Technical Border

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#D6A84F] text-[#090B0F] hover:bg-[#E5BC68] border border-[#F2CF84] pixel-shadow';
      case 'secondary':
        return 'bg-[#1A2128] text-[#E8E4D8] hover:bg-[#222B34] border border-[#2A333B] pixel-shadow';
      case 'danger':
        return 'bg-[#2E1214] text-[#D05A4A] hover:bg-[#3D181B] border border-[#D05A4A] pixel-shadow';
      case 'outline':
        return 'bg-transparent text-[#D6A84F] hover:bg-[#1A2128] border border-[#D6A84F] pixel-shadow';
      case 'ghost':
        return 'bg-transparent text-[#A9ADA8] hover:text-[#E8E4D8] hover:bg-[#141A20] border border-transparent';
      default:
        return 'bg-[#1A2128] text-[#E8E4D8] border border-[#2A333B]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-[10px] gap-1.5';
      case 'lg':
        return 'px-4 py-2.5 text-xs gap-2.5';
      case 'md':
      default:
        return 'px-3 py-1.5 text-[11px] gap-2';
    }
  };

  return (
    <button
      disabled={disabled || loading}
      className={`pixel-btn inline-flex items-center justify-center font-pixel uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
};
