export interface CourseRatingResponse {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userScore: number | null;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface RatingRequest {
  score: number;
}
