"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RatingDistribution } from "./RatingDistribution";

interface CourseRatingProps {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userScore: number | null;
  isEnrolled: boolean;
  onSubmitRating: (score: number) => Promise<void>;
  isSubmitting?: boolean;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function CourseRating({
  courseId,
  averageRating,
  ratingCount,
  userScore,
  isEnrolled,
  onSubmitRating,
  isSubmitting = false,
  ratingDistribution,
}: CourseRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(userScore);
  const { toast } = useToast();

  const handleStarClick = async (rating: number) => {
    if (!isEnrolled) {
      toast({
        title: "Không thể đánh giá",
        description: "Bạn cần đăng ký khóa học để có thể đánh giá.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) return;

    try {
      await onSubmitRating(rating);
      setSelectedStar(rating);
      toast({
        title: "Đã gửi đánh giá",
        description: `Bạn đã đánh giá ${rating} sao cho khóa học này.`,
      });
    } catch (error: any) {
      toast({
        title: "Không thể gửi đánh giá",
        description: error?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (
    count: number,
    filled: number,
    interactive: boolean = false,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClass = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }[size];

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, index) => {
          const starValue = index + 1;
          const isFilled =
            interactive && hoveredStar !== null
              ? starValue <= hoveredStar
              : starValue <= filled;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive || isSubmitting}
              onClick={() => interactive && handleStarClick(starValue)}
              onMouseEnter={() => interactive && setHoveredStar(starValue)}
              onMouseLeave={() => interactive && setHoveredStar(null)}
              className={cn(
                "transition-all",
                interactive && !isSubmitting && "cursor-pointer hover:scale-110",
                !interactive && "cursor-default",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              <Star
                className={cn(
                  sizeClass,
                  "transition-colors",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-300 dark:text-gray-600"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-8">
        {/* Rating Summary */}
        <div className="mb-8">
          <div className="mb-6 flex items-end gap-3">
            <div className="text-6xl font-bold tracking-tight">
              {averageRating ? averageRating.toFixed(1) : "0.0"}
            </div>
            <div className="pb-2">
              {renderStars(5, averageRating || 0, false, "md")}
              <p className="mt-1 text-sm text-muted-foreground">
                {ratingCount > 0
                  ? `${ratingCount.toLocaleString()} reviews`
                  : "No reviews yet"}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          {ratingDistribution && ratingCount > 0 && (
            <div className="mt-6">
              <RatingDistribution
                distributions={ratingDistribution}
                totalRatings={ratingCount}
              />
            </div>
          )}
        </div>

        {/* User Rating Section */}
        {isEnrolled && (
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="mb-3 text-lg font-semibold">
                {selectedStar ? "Your Rating" : "Rate this course"}
              </h3>
              <div className="flex justify-start">
                {renderStars(5, selectedStar || 0, true, "lg")}
              </div>
              {selectedStar && (
                <p className="mt-2 text-sm text-muted-foreground">
                  You rated {selectedStar} {selectedStar === 1 ? "star" : "stars"}
                </p>
              )}
            </div>
            {!selectedStar && (
              <p className="text-xs text-muted-foreground">
                Click on the stars to rate this course
              </p>
            )}
          </div>
        )}

        {/* Not Enrolled Message */}
        {!isEnrolled && (
          <div className="border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Enroll in this course to rate it
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
