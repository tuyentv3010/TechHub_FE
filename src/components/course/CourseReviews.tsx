"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CourseReviewsProps {
  reviews?: Review[];
  isLoading?: boolean;
}

export function CourseReviews({
  reviews = [],
  isLoading = false,
}: CourseReviewsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reviews</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-16 w-full rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <h2 className="mb-6 text-2xl font-bold">Reviews</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-muted-foreground">
              No reviews yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to review this course!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="mb-6 text-2xl font-bold">Reviews</h2>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
              <div className="flex gap-4">
                {/* User Avatar */}
                {review.userAvatar ? (
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-lg font-semibold text-white">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Review Content */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">{review.userName}</h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="mb-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Comment */}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
