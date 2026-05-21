import { useGetAccount } from "@/queries/useAccount";
import CourseCard from "./CourseCard";
import { Course } from "@/types/course";
import { normalizePublicMediaUrl } from "@/lib/file-media";

interface CourseWithInstructorId extends Omit<Course, 'instructor' | 'instructorAvatar'> {
  id: string; // Course ID for creating slug
  instructorId: string;
}

interface CourseCardWithInstructorProps {
  course: CourseWithInstructorId;
  variant?: "default" | "showcase";
}

export default function CourseCardWithInstructor({ course, variant = "default" }: CourseCardWithInstructorProps) {
  const { data: instructorResponse, isLoading } = useGetAccount({
    id: course.instructorId,
    enabled: !!course.instructorId,
  });
  
  const instructor = instructorResponse?.payload?.data;
  const instructorAvatar = normalizePublicMediaUrl(instructor?.avatar) || undefined;
  
  // Build the complete course object with instructor info
  const courseWithInstructor: Course = {
    ...course,
    id: course.id, // Pass course ID
    instructor: isLoading 
      ? "Loading..." 
      : instructor?.username || "Unknown Instructor",
    instructorAvatar,
  };
  
  return <CourseCard course={courseWithInstructor} variant={variant} />;
}
