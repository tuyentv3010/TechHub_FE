export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  watchedDuration: number;
  lastPosition: number;
  lastAccessed?: string;
}

export interface ChapterProgress {
  chapterId: string;
  completedLessons: number;
  totalLessons: number;
  lessons: LessonProgress[];
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastAccessed?: string;
  chapters: ChapterProgress[];
}

export interface UpdateProgressRequest {
  watchedDuration: number;
  lastPosition: number;
}
