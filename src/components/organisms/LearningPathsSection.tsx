"use client";

import { useTranslations } from "next-intl";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LearningPathItemType } from "@/schemaValidations/learning-path.schema";

export function LearningPathsSection() {
  const t = useTranslations("HomePage.learningPaths");
  
  const { data, isLoading } = useGetLearningPathList({
    page: 0,
    size: 4, // Show 4 paths as steps
    sortBy: "created",
    sortDirection: "DESC",
  });

  const paths = data?.payload?.data || [];

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="h-12 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (paths.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 z-10">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {t("title")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t("subtitle")}
              </p>
            </div>

            {/* Learning Path Steps */}
            <div className="space-y-4">
              {paths.slice(0, 4).map((path: LearningPathItemType, index: number) => {
                // Fixed titles for each step
                const stepTitles = [
                  t("step1"),
                  t("step2"),
                  t("step3"),
                  t("step4")
                ];
                
                return (
                  <Link
                    key={path.id}
                    href={`/learning-paths/${path.id}`}
                    className="block group"
                  >
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary">
                      {/* Step Number */}
                      <div className="absolute -left-3 -top-3 w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-500 dark:to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>

                      <div className="pl-4">
                        {path.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {path.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full font-medium">
                            {path.courses?.length || 0} {t("courses")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CTA Section */}
            <div className="pt-4">
              <p className="text-lg font-semibold text-teal-600 dark:text-teal-400 mb-4">
                {t("callToAction")}
              </p>
              <Link href="/learning-paths">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  {t("exploreAll")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Illustration - Staircase with Character */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[600px]">
              {/* Animated Character */}

              {/* Staircase Steps - 3D effect */}
              {[1, 2, 3, 4].map((step) => {
                const colors = [
                  { light: 'from-teal-300 to-teal-400', dark: 'from-teal-400 to-teal-500', shadow: 'bg-teal-600' },
                  { light: 'from-purple-300 to-purple-400', dark: 'from-purple-400 to-purple-500', shadow: 'bg-purple-600' },
                  { light: 'from-blue-300 to-blue-400', dark: 'from-blue-400 to-blue-500', shadow: 'bg-blue-600' },
                  { light: 'from-indigo-300 to-indigo-400', dark: 'from-indigo-400 to-indigo-500', shadow: 'bg-indigo-600' }
                ];
                const stepTitles = [
                  t("step1"),
                  t("step2"),
                  t("step3"),
                  t("step4")
                ];
                const color = colors[step - 1];
                const height = 140;
                const width = 280;
                const topY = 600 - (step * height);
                const leftX = (step - 1) * 70;

                return (
                  <g key={step}>
                    {/* Step Shadow (3D depth) */}
                    <div
                      className={`absolute ${color.shadow} opacity-30 rounded-lg`}
                      style={{
                        left: `${leftX + 10}px`,
                        top: `${topY + 10}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: 'skewY(-2deg)',
                      }}
                    />
                    
                    {/* Main Step */}
                    <div
                      className={`absolute bg-gradient-to-br ${color.light} dark:${color.dark} rounded-lg shadow-2xl border-2 border-white/20 overflow-hidden group-hover:scale-105 transition-transform`}
                      style={{
                        left: `${leftX}px`,
                        top: `${topY}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                      }}
                    >
                      {/* Step Title */}
                      <div className="absolute top-4 left-4 right-4">
                        <p className="text-sm font-bold text-white leading-tight line-clamp-2">
                          {stepTitles[step - 1]}
                        </p>
                      </div>
                      
                      {/* Step Number on the step */}
                      <div className="absolute bottom-4 right-4">
                        <span className="text-6xl font-black text-white/40">
                          0{step}
                        </span>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-4 left-4">
                        <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </g>
                );
              })}

              {/* Decorative floating elements */}
              <div className="absolute top-20 right-10 w-8 h-8 bg-teal-400 rounded-lg opacity-20 animate-float" style={{ animationDelay: '0s' }} />
              <div className="absolute top-40 left-10 w-6 h-6 bg-purple-400 rounded-lg opacity-20 animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-40 right-20 w-10 h-10 bg-blue-400 rounded-lg opacity-20 animate-float" style={{ animationDelay: '2s' }} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
