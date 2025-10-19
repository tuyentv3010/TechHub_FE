import { StatCard } from "@/components/atoms/StatCard";
import Image from "next/image";
import { Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";

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
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Total Students */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  </div>
                </div>
                <div className="text-blue-100 font-medium">Total Students</div>
              </div>

              {/* Total Courses */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  </div>
                </div>
                <div className="text-green-100 font-medium">Total Courses</div>
              </div>

              {/* Total Instructors */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stats.totalInstructors}</div>
                  </div>
                </div>
                <div className="text-purple-100 font-medium">Expert Instructors</div>
              </div>

              {/* Success Rate */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stats.successRate}</div>
                  </div>
                </div>
                <div className="text-orange-100 font-medium">Success Rate</div>
              </div>
            </div>  
          </div>
          
          {/* Right image */}
          <div className="relative">
            <div className="relative w-full h-[500px]">
              <Image
                src="/community-learning.png"
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