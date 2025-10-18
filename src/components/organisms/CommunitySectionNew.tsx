import { StatCard } from "@/components/atoms/StatCard";
import Image from "next/image";

interface CommunityStats {
  totalStudents: string;
  totalCourses: string;
  totalInstructors: string;
  successRate: string;
}

interface CommunitySectionProps {
  title: string;
  stats: CommunityStats;
}

export function CommunitySection({ title, stats }: CommunitySectionProps) {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content with stats */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard 
                number={stats.totalStudents} 
                label="Total Students" 
                className="bg-gradient-to-br from-blue-400 to-blue-500"
              />
              <StatCard 
                number={stats.totalCourses} 
                label="Total Courses" 
                className="bg-gradient-to-br from-green-400 to-green-500"
              />
              <StatCard 
                number={stats.totalInstructors} 
                label="Total Instructors" 
                className="bg-gradient-to-br from-purple-400 to-purple-500"
              />
              <StatCard 
                number={stats.successRate} 
                label="Success Rate" 
                className="bg-gradient-to-br from-red-400 to-red-500"
              />
            </div>
          </div>
          
          {/* Right image */}
          <div className="relative">
            <div className="relative w-full h-[400px]">
              <Image
                src="/community-learning.jpg"
                alt="Learning community"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}