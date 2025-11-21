"use client";

import { Badge } from "@/components/ui/badge";
import { Star, Users } from "lucide-react";
import Image from "next/image";

export default function TopCourses() {
  // Hardcoded data for preview
  const topCourses = [
    {
      id: "1",
      title: "Lập trình Web với React và Next.js",
      thumbnail: {
        secureUrl: "/courses/react-course.png",
      },
      totalEnrollments: 1245,
      averageRating: 4.8,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      price: 799000,
    },
    {
      id: "2",
      title: "Python cho Data Science và Machine Learning",
      thumbnail: {
        secureUrl: "/courses/python-course.png",
      },
      totalEnrollments: 987,
      averageRating: 4.9,
      level: "BEGINNER",
      status: "PUBLISHED",
      price: 899000,
    },
    {
      id: "3",
      title: "Khóa học Data Science và AI",
      thumbnail: {
        secureUrl: "/courses/data-science.png",
      },
      totalEnrollments: 756,
      averageRating: 4.7,
      level: "ADVANCED",
      status: "PUBLISHED",
      price: 1299000,
    },
    {
      id: "4",
      title: "JavaScript Nâng cao và TypeScript",
      thumbnail: null,
      totalEnrollments: 623,
      averageRating: 4.6,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      price: 699000,
    },
    {
      id: "5",
      title: "Node.js và Express Backend Development",
      thumbnail: null,
      totalEnrollments: 542,
      averageRating: 4.5,
      level: "BEGINNER",
      status: "PUBLISHED",
      price: 0,
    },
  ];

  return (
    <div className="space-y-4">
      {topCourses.map((course, index) => (
        <div
          key={course.id}
          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {index + 1}
          </div>

          {course.thumbnail && (
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              <Image
                src={course.thumbnail.secureUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{course.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{course.totalEnrollments || 0}</span>
              </div>
              {course.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{course.averageRating.toFixed(1)}</span>
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {course.level}
              </Badge>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="font-bold text-lg">
              {course.price === 0
                ? "Miễn phí"
                : `${course.price.toLocaleString()}đ`}
            </div>
            <Badge
              variant={
                course.status === "PUBLISHED" ? "default" : "secondary"
              }
            >
              {course.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
