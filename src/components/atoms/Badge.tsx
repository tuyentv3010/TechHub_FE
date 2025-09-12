import clsx from "clsx";
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-purple-600 text-white',
  success: 'bg-green-600 text-white',
  info: 'bg-blue-600 text-white'
};

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => (
  <span className={clsx('inline-block text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide', variantMap[variant], className)}>
    {children}
  </span>
);

export default Badge;

