import React from 'react';

interface MapContainerWrapperProps {
  children: React.ReactNode;
  heightClass?: string;
  className?: string;
  minHeight?: string;
}

/**
 * Reusable Map Container Wrapper that strictly enforces fixed/controlled dimensions,
 * prevents flex/grid layout collapses, blocks horizontal/vertical overflow,
 * and maintains map container stability during page scrolling and filter changes.
 */
export const MapContainerWrapper: React.FC<MapContainerWrapperProps> = ({
  children,
  heightClass = 'h-[520px] sm:h-[560px] lg:h-[600px]',
  className = '',
  minHeight = 'min-h-[400px]'
}) => {
  return (
    <div className={`relative w-full max-w-full min-w-0 min-h-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl ${minHeight} ${heightClass} ${className}`}>
      <div className="relative w-full h-full min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
