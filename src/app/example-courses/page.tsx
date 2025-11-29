"use client";

import { CoursesGridSection } from "@/components/organisms/CoursesGridSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Featured Courses using new API */}
      <CoursesGridSection
        title="Featured Courses"
        viewAllText="View All Courses"
        useApi={true}
        apiParams={{
          size: 6,
          status: "PUBLISHED",
          level: "ADVANCED"
        }}
      />

      {/* Popular Courses using new API */}
      <CoursesGridSection
        title="Popular Courses"
        viewAllText="View All"
        useApi={true}
        apiParams={{
          size: 6,
          status: "PUBLISHED"
        }}
      />

      {/* Beginner Courses using new API */}
      <CoursesGridSection
        title="Beginner Friendly"
        viewAllText="View All Beginner Courses"
        useApi={true}
        apiParams={{
          size: 6,
          status: "PUBLISHED",
          level: "BEGINNER"
        }}
      />
    </div>
  );
}