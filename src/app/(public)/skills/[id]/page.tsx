"use client";

import { useParams } from "next/navigation";
import { useGetSkills, useGetCourseList } from "@/queries/useCourse";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkillDetailPage() {
  const params = useParams();
  const skillId = params?.id as string;

  const { data: skillsData, isLoading: skillsLoading } = useGetSkills();
  const skills = skillsData?.payload?.data ?? [];
  const skill = skills.find((s: any) => s.id === skillId);

  const { data: coursesData, isLoading: coursesLoading } = useGetCourseList({ size: 100 });
  const allCourses = coursesData?.payload?.data ?? [];
  
  const { data: pathsData, isLoading: pathsLoading } = useGetLearningPathList({ size: 100 });
  const allPaths = pathsData?.payload?.data ?? [];

  // Debug: Log API responses
  
  // Debug: Log skills from each course
  allCourses.forEach((course: any) => {
  });
  
  // Debug: Log skills from each learning path
  allPaths.forEach((path: any) => {
  });

  // Filter courses and paths that have this skill
  const relatedCourses = allCourses.filter((course: any) => {
    // Course skills is array of objects: [{id, name, thumbnail, category}, ...]
    const hasSkill = course.skills?.some((s: any) => s.name === skill?.name);
    return hasSkill;
  });
  
  const relatedPaths = allPaths.filter((path: any) => {
    // Path skills is array of strings: ["skill1", "skill2", ...]
    const hasSkill = path.skills?.includes(skill?.name);
    return hasSkill;
  });


  if (skillsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (!skill) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Skill not found
        </h1>
        <Link href="/" className="text-purple-600 hover:underline">
          Return to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {skill.thumbnail ? (
                <Image
                  src={skill.thumbnail}
                  alt={skill.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold">
                  {skill.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{skill.name}</h1>
              {skill.category && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
                  {skill.category.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        {/* Courses Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Courses ({relatedCourses.length})
          </h2>
          
          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : relatedCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCourses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border dark:border-gray-700"
                >
                  <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-400">
                    {course.thumbnail && (
                      <Image
                        src={course.thumbnail.url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {course.level}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {course.duration || "Self-paced"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No courses found for this skill yet.
            </p>
          )}
        </section>

        {/* Learning Paths Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Learning Paths ({relatedPaths.length})
          </h2>
          
          {pathsLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : relatedPaths.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPaths.map((path: any) => (
                <Link
                  key={path.id}
                  href={`/learning-paths/${path.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow border dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {path.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{path.courses?.length || 0} courses</span>
                    {path.skills && (
                      <span>{path.skills.length} skills</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No learning paths found for this skill yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
