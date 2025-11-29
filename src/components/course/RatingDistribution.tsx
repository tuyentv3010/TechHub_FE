"use client";

import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  distributions?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalRatings: number;
}

export function RatingDistribution({
  distributions = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  totalRatings,
}: RatingDistributionProps) {
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  const bars = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: distributions[stars as keyof typeof distributions] || 0,
    percentage: getPercentage(distributions[stars as keyof typeof distributions] || 0),
  }));

  const getBarColor = (stars: number) => {
    if (stars === 5) return "bg-green-500";
    if (stars === 4) return "bg-lime-400";
    if (stars === 3) return "bg-yellow-400";
    if (stars === 2) return "bg-orange-400";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      {bars.map(({ stars, count, percentage }) => (
        <div key={stars} className="flex items-center gap-3">
          {/* Star label */}
          <div className="flex w-4 items-center justify-end text-sm font-medium">
            {stars}
          </div>

          {/* Progress bar */}
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(stars)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="w-12 text-right text-sm font-medium text-muted-foreground">
            {percentage}%
          </div>

          {/* Count */}
          <div className="w-12 text-right text-sm text-muted-foreground">
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}
