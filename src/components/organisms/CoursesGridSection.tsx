import CourseCard, { Course } from "@/components/molecules/CourseCard";
import CourseCardWithInstructor from "@/components/molecules/CourseCardWithInstructor";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";

interface CourseWithInstructorId extends Omit<Course, 'instructor' | 'instructorAvatar'> {
  instructorId: string;
}

interface CoursesGridSectionProps {
  title: string;
  viewAllText: string;
  courses?: Course[];
  coursesWithInstructorIds?: CourseWithInstructorId[];
}

export function CoursesGridSection({ title, viewAllText, courses, coursesWithInstructorIds }: CoursesGridSectionProps) {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <PrimaryButton variant="outline">
            {viewAllText}
          </PrimaryButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithInstructorIds ? (
            coursesWithInstructorIds.map((course, index) => (
              <CourseCardWithInstructor key={course.instructorId + index} course={course} />
            ))
          ) : courses ? (
            courses.map((course, index) => (
              <CourseCard key={index} course={course} />
            ))
          ) : null}
        </div>
      </div>
    </section>
  );
}