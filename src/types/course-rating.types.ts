export interface CourseRatingResponse {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userScore: number | null;
}

export interface RatingRequest {
  score: number;
}
