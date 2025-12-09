"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Filter, Loader2, Search, X, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  estimateReadingTime,
  getExcerptFromContent,
  normalizeTags,
  createBlogSlug,
} from "@/lib/blog";
import type { Blog } from "@/types/blog.types";
import { useBlogs, useBlogTags } from "@/queries/useBlog";

const PAGE_SIZE = 12;
const HERO_POSTS = 5;

const formatTagLabel = (tag: string) =>
  tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

// Hero Card - Lớn cho bài đầu tiên
const HeroPostCard = ({ blog }: { blog: Blog }) => {
  const coverImage = blog.thumbnail || blog.attachments?.find(
    (attachment) => attachment.type === "image"
  )?.url;
  const readingMinutes = estimateReadingTime(blog.content);
  const excerpt = getExcerptFromContent(blog.content, 300);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Link href={`/blog/${blogSlug}`}>
      <Card className="group flex h-full flex-col overflow-hidden border-muted-foreground/10 transition hover:border-primary/40 hover:shadow-xl">
        <CardHeader className="space-y-4 p-0">
          <div className="relative h-64 w-full overflow-hidden bg-muted">
            {coverImage ? (
              <div
                className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-muted transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-muted">
                <div className="text-center">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground/50">No thumbnail</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4 p-6">
          <CardTitle className="line-clamp-2 text-2xl transition group-hover:text-primary">
            {blog.title}
          </CardTitle>
          <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
          <div className="mt-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{format(new Date(blog.created), "dd/MM/yyyy")}</span>
              <span>•</span>
              <span>{readingMinutes} phút đọc</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Small Card cho các bài còn lại trong hero section
const SmallPostCard = ({ blog }: { blog: Blog }) => {
  const coverImage = blog.thumbnail || blog.attachments?.find(
    (attachment) => attachment.type === "image"
  )?.url;
  const readingMinutes = estimateReadingTime(blog.content);
  const excerpt = getExcerptFromContent(blog.content, 150);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Link href={`/blog/${blogSlug}`}>
      <Card className="group flex h-full flex-col overflow-hidden border-muted-foreground/10 transition hover:border-primary/40 hover:shadow-lg">
        <CardHeader className="space-y-3 p-0">
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            {coverImage ? (
              <div
                className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-muted transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-muted">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-3 p-4">
          <CardTitle className="line-clamp-2 text-base transition group-hover:text-primary">
            {blog.title}
          </CardTitle>
          <p className="line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
          <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{format(new Date(blog.created), "dd/MM/yyyy")}</span>
            <span>•</span>
            <span>{readingMinutes} phút đọc</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const BlogCardItem = ({ blog }: { blog: Blog }) => {
  const coverImage = blog.thumbnail || blog.attachments?.find(
    (attachment) => attachment.type === "image"
  )?.url;
  const readingMinutes = estimateReadingTime(blog.content);
  const excerpt = getExcerptFromContent(blog.content, 180);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-muted-foreground/10 transition hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="space-y-4 p-0">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {coverImage ? (
            <div
              className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-muted transition group-hover:scale-105"
              style={{
                backgroundImage: `url(${coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-muted">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
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
          <Link href={`/blog/${blogSlug}`}>Đọc bài viết</Link>
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

interface BlogListClientProps {
  initialBlogs: Blog[];
  initialTags: string[];
  initialPagination?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function BlogListClient({
  initialBlogs,
  initialTags,
  initialPagination,
}: BlogListClientProps) {
  const [rawSearch, setRawSearch] = useState("");
  const deferredSearch = useDeferredValue(rawSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [isClientFiltering, setIsClientFiltering] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedTags]);

  const hasFilters = selectedTags.length > 0 || rawSearch.trim();

  // Nếu không có filter và chưa "Xem thêm", fetch full list để chia hero + remaining
  // Nếu có filter hoặc đã "Xem thêm", fetch theo pagination bình thường
  const shouldFetchAll = !showAllPosts && !hasFilters;

  const filters = useMemo(
    () => ({
      page: shouldFetchAll ? 1 : page,
      size: shouldFetchAll ? 20 : PAGE_SIZE, // Fetch 20 bài để có đủ hero + remaining
      keyword: deferredSearch.trim() || undefined,
      tags: selectedTags.length ? selectedTags : undefined,
    }),
    [shouldFetchAll, page, deferredSearch, selectedTags]
  );

  // Only fetch from client when user interacts with filters
  const {
    data: blogPage,
    isLoading,
    isFetching,
    error,
  } = useBlogs(filters);

  const availableTags = useMemo(
    () => normalizeTags(initialTags),
    [initialTags]
  );

  // Use initial data if no client filtering, otherwise use fetched data
  const allBlogs = isClientFiltering 
    ? (blogPage?.payload?.data ?? [])
    : initialBlogs;
  
  // Chia blogs thành hero và remaining khi không có filter
  const heroPosts = shouldFetchAll ? allBlogs.slice(0, HERO_POSTS) : [];
  const blogs = shouldFetchAll ? allBlogs.slice(HERO_POSTS) : allBlogs;
  const pagination = isClientFiltering ? blogPage?.payload?.pagination : initialPagination;

  const toggleTag = (tag: string) => {
    setIsClientFiltering(true);
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
    setShowAllPosts(true); // Khi filter, hiện full list
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setRawSearch("");
    setShowAllPosts(false);
    setIsClientFiltering(false);
  };

  const handleSearchChange = (value: string) => {
    setRawSearch(value);
    setShowAllPosts(true);
    setIsClientFiltering(true);
  };

  const handleShowAllPosts = () => {
    setShowAllPosts(true);
    setIsClientFiltering(true);
  };

  const showLoading = isClientFiltering && isLoading;

  return (
    <main className="min-h-screen bg-background pb-20 pt-16">
      {/* PHẦN 1: Hero Section - 5 bài đầu */}
      {!showAllPosts && !hasFilters && (
        <section className="container mx-auto px-4 pb-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="mt-2 text-muted-foreground">
                Các bài viết mới nhất
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleShowAllPosts}
              className="text-primary hover:text-primary/80"
            >
              Xem thêm →
            </Button>
          </div>

          {heroPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Bài đầu tiên chiếm 2 cột */}
              <div className="md:col-span-2">
                <HeroPostCard blog={heroPosts[0]} />
              </div>
              
              {/* 4 bài còn lại */}
              {heroPosts.slice(1, 5).map((blog: Blog) => (
                <SmallPostCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* PHẦN 2: Thư viện với Filter */}
      <section className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {showAllPosts || hasFilters ? "Thư viện" : "Bài viết khác"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tìm kiếm và lọc theo chủ đề bạn quan tâm
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 space-y-6 rounded-2xl border border-muted/30 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={rawSearch}
                onChange={(event) => handleSearchChange(event.target.value)}
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
              {isFetching && isClientFiltering && (
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
              {/* Button ALL */}
              <Button
                variant={selectedTags.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTags([]);
                  if (selectedTags.length > 0) {
                    setIsClientFiltering(true);
                  }
                }}
                className="rounded-full"
              >
                All
              </Button>
              
              {availableTags.length > 0 ? (
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
              ) : null}
            </div>
          </div>
        </div>

        {/* PHẦN 3: Blog Grid */}
        <section className="mt-12">
          {error ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
              Không thể tải danh sách blog. Vui lòng thử lại sau.
            </div>
          ) : showLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl border border-muted/30 bg-card p-12 text-center text-muted-foreground">
              Không tìm thấy bài viết nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {blogs.map((blog: Blog) => (
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
                onClick={() => {
                  setIsClientFiltering(true);
                  setPage((prev) => Math.max(prev - 1, 1));
                }}
                disabled={!pagination.hasPrevious || page === 1}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsClientFiltering(true);
                  setPage((prev) =>
                    pagination.hasNext ? prev + 1 : prev
                  );
                }}
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
