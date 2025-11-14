export interface CourseComment {
  id: string;
  courseId?: string;
  lessonId?: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  created: string;
  updated: string;
  replies: CourseComment[];
}

export interface AddCourseCommentBody {
  content: string;
  parentCommentId?: string;
}

export interface AddLessonCommentBody {
  content: string;
  parentCommentId?: string;
}
