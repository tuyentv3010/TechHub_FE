import CourseCard from "@/components/molecules/CourseCard";
import CourseCardWithInstructor from "@/components/molecules/CourseCardWithInstructor";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { useGetCourses } from "@/queries/useCourse";
import { Course, transformApiCourse } from "@/types/course";

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
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-red-500">Error loading courses. Please try again later.</p>
        </div>
      </section>
    );
  }

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
          {displayCoursesWithInstructors.length > 0 ? (
            displayCoursesWithInstructors.map((course, index) => (
              <CourseCardWithInstructor key={course.instructorId + index} course={course} />
            ))
          ) : displayCourses.length > 0 ? (
            displayCourses.map((course, index) => (
              <CourseCard key={course.id || index} course={course} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No courses available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}