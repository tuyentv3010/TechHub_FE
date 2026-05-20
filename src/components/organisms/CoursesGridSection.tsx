import CourseCard from "@/components/molecules/CourseCard";
import CourseCardWithInstructor from "@/components/molecules/CourseCardWithInstructor";
import { useGetCourses } from "@/queries/useCourse";
import { Course, transformApiCourse } from "@/types/course";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";
import { ArrowRight } from "lucide-react";

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
      <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--app-surface-subtle))_100%)] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              <div className="h-9 w-80 max-w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
          </div>
          
          <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border/70 bg-card p-2.5 shadow-sm">
                <div className="aspect-[1.7/1] animate-pulse rounded-lg bg-muted"></div>
                <div className="space-y-4 p-4">
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
      <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--app-surface-subtle))_100%)] py-20">
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
    <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--app-surface-subtle))_100%)] py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {title}
            </h2>
          </div>
          <Button asChild variant="outline" className="h-10 shrink-0 rounded-full px-5">
            <Link href="/courses" className="inline-flex items-center gap-2">
              {viewAllText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayCoursesWithInstructors.length > 0 ? (
            displayCoursesWithInstructors.map((course, index) => (
              <CourseCardWithInstructor key={course.instructorId + index} course={course} variant="showcase" />
            ))
          ) : displayCourses.length > 0 ? (
            displayCourses.map((course, index) => (
              <CourseCard key={course.id || index} course={course} variant="showcase" />
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
