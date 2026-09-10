import React from 'react';

interface PixelDividerProps {
  label?: string;
  className?: string;
  dashed?: boolean;
}

export const PixelDivider: React.FC<PixelDividerProps> = ({
  label,
  className = '',
  dashed = false,
}) => {
  return (
    <div className={`relative flex items-center my-3 select-none ${className}`}>
      <div
        className={`flex-grow border-t ${
          dashed ? 'border-dashed border-[#2A333B]' : 'border-[#2A333B]'
        }`}
      />
      {label ? (
        <span className="px-2 font-pixel text-[9px] text-[#66727C] tracking-widest uppercase bg-[#141A20] border border-[#2A333B] mx-2">
          {label}
        </span>
      ) : (
        <span className="w-1.5 h-1.5 bg-[#D6A84F] mx-2 rotate-45 shrink-0" />
      )}
      <div
        className={`flex-grow border-t ${
          dashed ? 'border-dashed border-[#2A333B]' : 'border-[#2A333B]'
        }`}
      />
    </div>
  );
};
