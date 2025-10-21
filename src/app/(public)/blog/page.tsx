"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Filter, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useBlogTags, useBlogs } from "@/queries/useBlog";
import {
  estimateReadingTime,
  getExcerptFromContent,
  normalizeTags,
} from "@/lib/blog";
import type { Blog } from "@/types/blog.types";

const PAGE_SIZE = 6;

const formatTagLabel = (tag: string) =>
  tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const BlogCardItem = ({ blog }: { blog: Blog }) => {
  const coverImage = blog.attachments?.find(
    (attachment) => attachment.type === "image"
  )?.url;
  const readingMinutes = estimateReadingTime(blog.content);
  const excerpt = getExcerptFromContent(blog.content, 180);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-muted-foreground/10 transition hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="space-y-4 p-0">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <div
            className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-muted transition group-hover:scale-105"
            style={
              coverImage
                ? {
                    backgroundImage: `url(${coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
        </div>
        <div className="space-y-3 px-6 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{format(new Date(blog.created), "dd/MM/yyyy")}</span>
            <span>•</span>
            <span>{readingMinutes} phút đọc</span>
          </div>
          <CardTitle className="line-clamp-2 text-xl transition group-hover:text-primary">
            {blog.title}
          </CardTitle>
          <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-4 px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {blog.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full text-xs">
              #{formatTagLabel(tag)}
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full" variant="secondary">
          <Link href={`/blog/${blog.id}`}>Đọc bài viết</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const BlogCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-muted/20 bg-card">
    <Skeleton className="h-48 w-full" />
    <div className="space-y-3 p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default function BlogListingPage() {
  const [rawSearch, setRawSearch] = useState("");
  const deferredSearch = useDeferredValue(rawSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedTags]);

  const filters = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: deferredSearch.trim() || undefined,
      tags: selectedTags.length ? selectedTags : undefined,
    }),
    [page, deferredSearch, selectedTags]
  );

  const {
    data: blogPage,
    isLoading,
    isFetching,
    error,
  } = useBlogs(filters);
  const { data: tagResponse, isLoading: isLoadingTags } = useBlogTags();

  const availableTags = useMemo(
    () => normalizeTags(tagResponse?.data ?? []),
    [tagResponse?.data]
  );

  const blogs = blogPage?.data ?? [];
  const pagination = blogPage?.pagination;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setRawSearch("");
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-16">
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Blog & Kiến Thức
          </h1>
          <p className="mt-4 text-muted-foreground">
            Tổng hợp chia sẻ từ giảng viên và cộng đồng TechHub. Tìm kiếm bài
            viết theo chủ đề bạn quan tâm.
          </p>
        </div>

        <div className="mt-12 space-y-6 rounded-2xl border border-muted/30 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={rawSearch}
                onChange={(event) => setRawSearch(event.target.value)}
                placeholder="Tìm kiếm theo tiêu đề..."
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              {(rawSearch || selectedTags.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              )}
              {isFetching && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Chủ đề</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {isLoadingTags ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-20 rounded-full" />
                ))
              ) : availableTags.length > 0 ? (
                availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="rounded-full capitalize"
                    >
                      {formatTagLabel(tag)}
                    </Button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có tag nào được tạo.
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="mt-12">
          {error ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
              Không thể tải danh sách blog. Vui lòng thử lại sau.
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl border border-muted/30 bg-card p-12 text-center text-muted-foreground">
              Không tìm thấy bài viết nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCardItem key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>

        {pagination && blogs.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {pagination.page + 1} / {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevious || page === 1}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((prev) =>
                    pagination.hasNext ? prev + 1 : prev
                  )
                }
                disabled={!pagination.hasNext}
              >
                Trang tiếp
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
