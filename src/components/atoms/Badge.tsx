import clsx from "clsx";
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-emerald-600 text-white dark:bg-emerald-500',
  info: 'bg-primary text-primary-foreground'
};

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => (
  <span className={clsx('inline-block text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide', variantMap[variant], className)}>
    {children}
  </span>
);

export default Badge;

