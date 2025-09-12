import React from 'react';
import clsx from 'clsx';

interface StarRatingProps {
  value: number; // 0-5
  className?: string;
  size?: number; // px size per star
}

const Star = ({ filled, size }: { filled: boolean; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill={filled ? '#b4690e' : 'none'}
    stroke="#b4690e"
    strokeWidth={filled ? 0 : 1.2}
  >
    <path d="M10 1.9l2.47 5 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.9z" />
  </svg>
);

export const StarRating: React.FC<StarRatingProps> = ({ value, className, size = 14 }) => {
  const full = Math.round(value * 10) / 10; // one decimal
  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.round(value - 0.25));
  return (
    <div className={clsx('flex items-center gap-1', className)} aria-label={`Rating ${full} out of 5`}>
      <span className="text-[12px] font-semibold text-[#b4690e] leading-none">{full.toFixed(1)}</span>
      <div className="flex items-center gap-[2px]">
        {stars.map((f, idx) => <Star key={idx} filled={f} size={size} />)}
      </div>
    </div>
  );
};

export default StarRating;

