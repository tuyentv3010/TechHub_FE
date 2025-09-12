import { featuredCourses } from "@/constants/homeData";
import CourseCard from "../molecules/CourseCard";

export function FeaturedCoursesSection() {
  return (
    <section className="py-14 px-6 md:px-12 max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Featured Courses</h2>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {featuredCourses.map(c => <CourseCard key={c.id} course={c} />)}
      </div>
    </section>
  );
}

export default FeaturedCoursesSection;

