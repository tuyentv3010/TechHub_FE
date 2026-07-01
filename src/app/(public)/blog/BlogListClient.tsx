"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { FileText, Filter, Search, X } from "lucide-react";

import { PublicPagination } from "@/components/common/public-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createBlogSlug,
  estimateReadingTime,
  getBlogImageUrl,
  getExcerptFromContent,
  normalizeTags,
} from "@/lib/blog";
import type { Blog } from "@/types/blog.types";

const HERO_POSTS = 5;
const BLOG_PAGE_SIZE = 12;

const formatTagLabel = (tag: string) =>
  tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const CoverImage = ({
  blog,
  className,
  emptyIconClassName = "h-12 w-12",
}: {
  blog: Blog;
  className: string;
  emptyIconClassName?: string;
}) => {
  const coverImage = getBlogImageUrl(blog);

  return (
    <div className={`relative w-full overflow-hidden bg-muted ${className}`}>
      {coverImage ? (
        <div
          className="th-hover-zoom h-full w-full bg-muted"
          style={{
            backgroundImage: `url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <FileText className={`${emptyIconClassName} text-muted-foreground/30`} />
        </div>
      )}
    </div>
  );
};

const PostMeta = ({ blog }: { blog: Blog }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
    <span>{format(new Date(blog.created), "dd/MM/yyyy")}</span>
    <span>•</span>
    <span>{estimateReadingTime(blog.content)} phút đọc</span>
  </div>
);

const HeroPostCard = ({ blog }: { blog: Blog }) => {
  const excerpt = getExcerptFromContent(blog.content, 300);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Link href={`/blog/${blogSlug}`}>
      <Card className="group th-hover-lift th-focus-ring flex h-full flex-col overflow-hidden border border-border shadow-sm">
        <CardHeader className="space-y-4 p-0">
          <CoverImage blog={blog} className="h-64" emptyIconClassName="h-16 w-16" />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4 p-6">
          <CardTitle className="th-hover-title line-clamp-2 text-2xl">
            {blog.title}
          </CardTitle>
          <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
          <div className="mt-auto">
            <PostMeta blog={blog} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const SmallPostCard = ({ blog }: { blog: Blog }) => {
  const excerpt = getExcerptFromContent(blog.content, 150);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Link href={`/blog/${blogSlug}`}>
      <Card className="group th-hover-lift th-focus-ring flex h-full flex-col overflow-hidden border border-muted-foreground/10 shadow-sm">
        <CardHeader className="space-y-3 p-0">
          <CoverImage blog={blog} className="h-40" emptyIconClassName="h-10 w-10" />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-3 p-4">
          <CardTitle className="th-hover-title line-clamp-2 text-base">
            {blog.title}
          </CardTitle>
          <p className="line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
          <div className="mt-auto">
            <PostMeta blog={blog} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const BlogCardItem = ({ blog }: { blog: Blog }) => {
  const excerpt = getExcerptFromContent(blog.content, 180);
  const blogSlug = createBlogSlug(blog.title, blog.id);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-muted-foreground/10 transition hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="space-y-4 p-0">
        <CoverImage blog={blog} className="h-48" />
        <div className="space-y-3 px-6 pt-4">
          <PostMeta blog={blog} />
          <CardTitle className="th-hover-title line-clamp-2 text-xl">
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
}: BlogListClientProps) {
  const [rawSearch, setRawSearch] = useState("");
  const deferredSearch = useDeferredValue(rawSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [page, setPage] = useState(0);

  const normalizedSelectedTags = useMemo(
    () => normalizeTags(selectedTags),
    [selectedTags]
  );

  const availableTags = useMemo(
    () =>
      normalizeTags([
        ...initialTags,
        ...initialBlogs.flatMap((blog) => blog.tags ?? []),
      ]),
    [initialBlogs, initialTags]
  );

  const filteredBlogs = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return initialBlogs.filter((blog) => {
      const blogTags = normalizeTags(blog.tags ?? []);
      const matchesTags =
        normalizedSelectedTags.length === 0 ||
        normalizedSelectedTags.some((tag) => blogTags.includes(tag));

      if (!matchesTags) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableText = [
        blog.title,
        getExcerptFromContent(blog.content, 10000),
        ...blogTags,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [deferredSearch, initialBlogs, normalizedSelectedTags]);

  const hasFilters =
    normalizedSelectedTags.length > 0 || deferredSearch.trim().length > 0;
  const allBlogs = hasFilters ? filteredBlogs : initialBlogs;
  const shouldShowHero = !showAllPosts && !hasFilters;
  const heroPosts = shouldShowHero ? allBlogs.slice(0, HERO_POSTS) : [];
  const listSourceBlogs = shouldShowHero ? allBlogs.slice(HERO_POSTS) : allBlogs;
  const totalPages = Math.max(1, Math.ceil(listSourceBlogs.length / BLOG_PAGE_SIZE));
  const blogs = listSourceBlogs.slice(
    page * BLOG_PAGE_SIZE,
    page * BLOG_PAGE_SIZE + BLOG_PAGE_SIZE
  );

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
    setPage(0);
    setShowAllPosts(true);
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setRawSearch("");
    setShowAllPosts(false);
    setPage(0);
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
    setPage(0);
    if (!rawSearch.trim()) {
      setShowAllPosts(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-16">
      {!showAllPosts && !hasFilters && (
        <section className="container mx-auto px-4 pb-12">
          <div className="mb-8 flex items-center justify-between">
            <p className="mt-2 text-muted-foreground">Các bài viết mới nhất</p>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAllPosts(true);
                setPage(0);
              }}
              className="text-primary hover:text-primary/80"
            >
              Xem thêm →
            </Button>
          </div>

          {heroPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2">
                <HeroPostCard blog={heroPosts[0]} />
              </div>
              {heroPosts.slice(1, 5).map((blog) => (
                <SmallPostCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      <section className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {showAllPosts || hasFilters ? "Thư viện" : "Bài viết khác"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tìm kiếm và lọc theo chủ đề bạn quan tâm
          </p>
        </div>

        <div className="mb-8 space-y-6 rounded-2xl border border-muted/30 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={rawSearch}
                onChange={(event) => {
                  setRawSearch(event.target.value);
                  setShowAllPosts(true);
                  setPage(0);
                }}
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
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Chủ đề</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTags.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={clearTagFilters}
                className="rounded-full"
              >
                All
              </Button>

              {availableTags.map((tag) => {
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
              })}
            </div>
          </div>
        </div>

        <section className="mt-12">
          {blogs.length === 0 ? (
            <div className="rounded-2xl border border-muted/30 bg-card p-12 text-center text-muted-foreground">
              Không tìm thấy bài viết nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {blogs.map((blog) => (
                <BlogCardItem key={blog.id} blog={blog} />
              ))}
            </div>
          )}
          {listSourceBlogs.length > BLOG_PAGE_SIZE ? (
            <PublicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              previousLabel="Trước"
              nextLabel="Sau"
              className="mt-8"
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}
