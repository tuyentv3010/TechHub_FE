'use client';

import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = 'xl' 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn(
      'container mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({ 
  children, 
  className = '', 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridClasses = cn(
    'grid',
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gapClasses[gap],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  responsive?: boolean;
}

export function ResponsiveText({ 
  children, 
  className = '', 
  size = 'base',
  responsive = true 
}: ResponsiveTextProps) {
  const responsiveClasses = {
    xs: responsive ? 'text-xs sm:text-sm' : 'text-xs',
    sm: responsive ? 'text-sm sm:text-base' : 'text-sm',
    base: responsive ? 'text-base sm:text-lg' : 'text-base',
    lg: responsive ? 'text-lg sm:text-xl' : 'text-lg',
    xl: responsive ? 'text-xl sm:text-2xl' : 'text-xl',
    '2xl': responsive ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-2xl',
    '3xl': responsive ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-3xl',
    '4xl': responsive ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-4xl',
    '5xl': responsive ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-5xl',
  };

  return (
    <div className={cn(responsiveClasses[size], className)}>
      {children}
    </div>
  );
}