"use client";

import { format } from "date-fns";
import { ArrowRight, Clock, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppSurface, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createBlogSlug,
  estimateReadingTime,
  getBlogImageUrl,
  getExcerptFromContent,
} from "@/lib/blog";
import { useBlogs } from "@/queries/useBlog";
import type { Blog } from "@/types/blog.types";

interface BlogSectionProps {
  title: string;
  subtitle: string;
}

export function BlogSection({ title, subtitle }: BlogSectionProps) {
  const { data: blogResponse, isLoading } = useBlogs({
    page: 1,
    size: 6,
  });

  const blogs = blogResponse?.payload?.data ?? [];

  if (isLoading) {
    return (
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <PageHeader title={title} description={subtitle} className="mb-10" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <AppSurface key={index} padding="none" className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </AppSurface>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          eyebrow="Resources"
          title={title}
          description={subtitle}
          actions={
            <Button asChild variant="outline">
              <Link href="/blog">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
          className="mb-10"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {blogs.map((blog: Blog) => {
            const excerpt = getExcerptFromContent(blog.content, 120);
            const readingTime = estimateReadingTime(blog.content);
            const createdDate = new Date(blog.created);
            const dateNum = format(createdDate, "dd");
            const monthName = format(createdDate, "MMM");
            const coverImage = getBlogImageUrl(blog);
            const blogSlug = createBlogSlug(blog.title, blog.id);

            return (
              <Link
                href={`/blog/${blogSlug}`}
                key={blog.id}
                className="group block h-full th-focus-ring rounded-xl"
              >
                <AppSurface
                  padding="none"
                  interactive
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={blog.title}
                        fill
                        className="th-hover-zoom object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-lg border border-border bg-card px-3 py-2 text-center shadow-sm">
                      <div className="text-lg font-semibold leading-none text-foreground">{dateNum}</div>
                      <div className="mt-1 text-xs font-medium uppercase text-muted-foreground">{monthName}</div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="th-hover-title mb-3 line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                      {blog.title}
                    </h3>
                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{readingTime} min</span>
                      </div>
                      {blog.tags && blog.tags.length > 0 ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[hsl(var(--learning-accent))]" />
                          <span className="truncate capitalize">{blog.tags[0]}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </AppSurface>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
