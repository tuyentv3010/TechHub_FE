"use client";

import Image from "next/image";
import Link from "next/link";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { Clock, FileText, MapPin } from "lucide-react";
import { useBlogs } from "@/queries/useBlog";
import { format } from "date-fns";
import { getExcerptFromContent, estimateReadingTime, createBlogSlug } from "@/lib/blog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Blog } from "@/types/blog.types";

interface BlogSectionProps {
  title: string;
  subtitle: string;
}

export function BlogSection({ title, subtitle }: BlogSectionProps) {
  // Fetch 6 bài blog mới nhất từ API
  const { data: blogResponse, isLoading } = useBlogs({
    page: 1,
    size: 6,
  });

  const blogs = blogResponse?.payload?.data ?? [];

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
        
        {/* Blog Grid - 2 rows, 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {blogs.map((blog: Blog) => {
            const excerpt = getExcerptFromContent(blog.content, 120);
            const readingTime = estimateReadingTime(blog.content);
            const createdDate = new Date(blog.created);
            const dateNum = format(createdDate, "dd");
            const monthName = format(createdDate, "MMMM");
            const coverImage = blog.thumbnail || "/blogs/default.jpg";
            const blogSlug = createBlogSlug(blog.title, blog.id);
            
            return (
              <Link href={`/blog/${blogSlug}`} key={blog.id}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                  {/* Blog Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-yellow-400 dark:bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg shadow-lg">
                        <div className="text-xl font-bold leading-none">{dateNum}</div>
                        <div className="text-xs font-medium uppercase">{monthName}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed line-clamp-3">
                      {excerpt}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-teal-600 dark:text-teal-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{readingTime} phút đọc</span>
                      </div>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium capitalize">{blog.tags[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="text-center">
          <Link href="/blog">
            <PrimaryButton size="lg" variant="outline">
              View All Posts
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </section>
  );
}