import { useGetAccount } from "@/queries/useAccount";
import CourseCard, { Course } from "./CourseCard";

interface CourseWithInstructorId extends Omit<Course, 'instructor' | 'instructorAvatar'> {
  id: string; // Course ID for creating slug
  instructorId: string;
}

interface CourseCardWithInstructorProps {
  course: CourseWithInstructorId;
}

export default function CourseCardWithInstructor({ course }: CourseCardWithInstructorProps) {
  const { data: instructorResponse, isLoading } = useGetAccount({
    id: course.instructorId,
    enabled: !!course.instructorId,
  });
  
  const instructor = instructorResponse?.payload?.data;
  
  // Build the complete course object with instructor info
  const courseWithInstructor: Course = {
    ...course,
    id: course.id, // Pass course ID
    instructor: isLoading 
      ? "Loading..." 
      : instructor?.username || "Unknown Instructor",
    instructorAvatar: instructor?.avatar || "/avatars/default.jpg",
  };
  
  return <CourseCard course={courseWithInstructor} />;
}
