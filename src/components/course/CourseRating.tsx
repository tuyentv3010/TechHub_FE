"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CourseRatingProps {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userScore: number | null;
  isEnrolled: boolean;
  onSubmitRating: (score: number) => Promise<void>;
  isSubmitting?: boolean;
}

export function CourseRating({
  courseId,
  averageRating,
  ratingCount,
  userScore,
  isEnrolled,
  onSubmitRating,
  isSubmitting = false,
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
      lg: "h-8 w-8",
    }[size];

    return (
      <div className="flex items-center gap-1">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" />
          Đánh giá khóa học
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Rating Display */}
        <div className="text-center">
          <div className="mb-2 text-5xl font-bold text-yellow-400">
            {averageRating ? averageRating.toFixed(1) : "N/A"}
          </div>
          <div className="mb-3 flex justify-center">
            {renderStars(5, averageRating || 0, false, "md")}
          </div>
          <p className="text-sm text-muted-foreground">
            {ratingCount > 0
              ? `${ratingCount} đánh giá`
              : "Chưa có đánh giá nào"}
          </p>
        </div>

        {/* User Rating Section */}
        {isEnrolled && (
          <div className="border-t pt-6">
            <div className="mb-3 text-center">
              <p className="mb-2 text-sm font-medium">
                {selectedStar
                  ? "Đánh giá của bạn"
                  : "Đánh giá khóa học này"}
              </p>
              <div className="flex justify-center">
                {renderStars(5, selectedStar || 0, true, "lg")}
              </div>
              {selectedStar && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Bạn đã đánh giá {selectedStar} sao
                </p>
              )}
            </div>
            {!selectedStar && (
              <p className="text-center text-xs text-muted-foreground">
                Click vào số sao để đánh giá
              </p>
            )}
          </div>
        )}

        {/* Not Enrolled Message */}
        {!isEnrolled && (
          <div className="border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Đăng ký khóa học để có thể đánh giá
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
