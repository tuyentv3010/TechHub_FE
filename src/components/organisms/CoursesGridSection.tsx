import CourseCard from "@/components/molecules/CourseCard";
import CourseCardWithInstructor from "@/components/molecules/CourseCardWithInstructor";
import { useGetCourses } from "@/queries/useCourse";
import { Course, transformApiCourse } from "@/types/course";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/common";

interface CourseWithInstructorId extends Omit<Course, 'instructor' | 'instructorAvatar' | 'id'> {
  id: string;
  instructorId: string;
}

interface CoursesGridSectionProps {
  title: string;
  viewAllText: string;
  courses?: Course[];
  coursesWithInstructorIds?: CourseWithInstructorId[];
  // New props for API integration
  useApi?: boolean;
  apiParams?: {
    page?: number;
    size?: number;
    status?: string;
    level?: string;
    language?: string;
  };
}

export function CoursesGridSection({ 
  title, 
  viewAllText, 
  courses, 
  coursesWithInstructorIds,
  useApi = false,
  apiParams
}: CoursesGridSectionProps) {
  
  // Fetch courses from API if useApi is true
  const { data: apiResponse, isLoading, error } = useGetCourses(
    useApi ? { 
      page: 0, 
      size: 6, 
      status: "PUBLISHED",
      ...apiParams 
    } : undefined
  );

  // Transform API courses to Course type
  const apiCourses = apiResponse?.data ? apiResponse.data.map(apiCourse => transformApiCourse(apiCourse)) : [];

  // Determine which courses to display
  const displayCourses = useApi ? apiCourses : (courses || []);
  const displayCoursesWithInstructors = coursesWithInstructorIds || [];

  if (useApi && isLoading) {
    return (
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <PageHeader
            className="mb-10"
            title={title}
            actions={<Button asChild variant="outline"><Link href="/courses">{viewAllText}</Link></Button>}
          />
          
          <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="h-48 animate-pulse bg-muted"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 animate-pulse rounded bg-muted"></div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (useApi && error) {
    return (
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <EmptyState
            title={title}
            description="Error loading courses. Please try again later."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          className="mb-10"
          title={title}
          actions={<Button asChild variant="outline"><Link href="/courses">{viewAllText}</Link></Button>}
        />
        <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayCoursesWithInstructors.length > 0 ? (
            displayCoursesWithInstructors.map((course, index) => (
              <CourseCardWithInstructor key={course.instructorId + index} course={course} />
            ))
          ) : displayCourses.length > 0 ? (
            displayCourses.map((course, index) => (
              <CourseCard key={course.id || index} course={course} />
            ))
          ) : (
            <EmptyState
              className="col-span-full"
              title="No courses available"
              description="Published courses will appear here when they are ready."
            />
          )}
        </div>
      </div>
    </section>
  );
}
