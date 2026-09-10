import React from 'react';

interface StorySectionProps {
  stepNumber?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  characterSlot?: React.ReactNode;
  children: React.ReactNode;
  actionSlot?: React.ReactNode;
  className?: string;
  id?: string;
}

export const StorySection: React.FC<StorySectionProps> = ({
  stepNumber,
  eyebrow,
  title,
  subtitle,
  characterSlot,
  children,
  actionSlot,
  className = '',
  id,
}) => {
  return (
    <section id={id} className={`py-4 md:py-6 ${className}`}>
      {/* Section Header: Editorial & Readable */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#DDD5C5]/80 mb-5">
        <div className="flex items-start gap-4">
          {characterSlot && (
            <div className="shrink-0 p-1 bg-[#FAF8F1] border border-[#DDD5C5] rounded-xs shadow-2xs">
              {characterSlot}
            </div>
          )}
          <div>
            {(stepNumber || eyebrow) && (
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#718894] uppercase font-bold mb-1">
                {stepNumber && <span className="text-[#C89638]">{stepNumber}</span>}
                {stepNumber && eyebrow && <span>//</span>}
                {eyebrow && <span>{eyebrow}</span>}
              </div>
            )}
            <h2 className="font-sans text-xl md:text-2xl font-bold text-[#18201D] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans text-sm text-[#576560] mt-1 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionSlot && <div className="shrink-0">{actionSlot}</div>}
      </div>

      {/* Section Content */}
      <div>{children}</div>
    </section>
  );
};
