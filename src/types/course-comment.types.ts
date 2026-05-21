export interface CourseComment {
  id: string;
  courseId?: string;
  lessonId?: string;
  userId: string;
  content: string;
  parentId?: string | null;
  parentCommentId?: string;
  created: string;
  updated: string;
  replies: CourseComment[];
  isPending?: boolean;
}

export interface AddCourseCommentBody {
  content: string;
  parentCommentId?: string;
}

export interface AddLessonCommentBody {
  content: string;
  parentCommentId?: string;
}
