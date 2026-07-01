"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, TrendingUp, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PublicPagination } from "@/components/common/public-pagination";
import { normalizeLearningPathListPayload } from "@/lib/learning-paths";
import { LearningPathItemType, LearningPathPaginationType } from "@/schemaValidations/learning-path.schema";

const LEARNING_PATH_PAGE_SIZE = 9;

interface LearningPathsClientProps {
  initialPaths: LearningPathItemType[];
  initialPagination: LearningPathPaginationType | null;
}

export default function LearningPathsClient({
  initialPaths,
  initialPagination,
}: LearningPathsClientProps) {
  const t = useTranslations("LearningPaths");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [isClientFiltering, setIsClientFiltering] = useState(false);

  // Fetch learning paths (use initial data if not filtering)
  const { data, isLoading } = useGetLearningPathList({
    page,
    size: LEARNING_PATH_PAGE_SIZE,
    sortBy: "created",
    sortDirection: "DESC",
  });
  const clientLearningPaths = normalizeLearningPathListPayload(data?.payload);

  // Use SSR data for initial render, client data after filtering
  const paths = isClientFiltering 
    ? clientLearningPaths.data
    : data
      ? clientLearningPaths.data
      : initialPaths;
  const pagination = isClientFiltering 
    ? clientLearningPaths.pagination
    : data
      ? clientLearningPaths.pagination
      : initialPagination;

  const filteredPaths = paths.filter((path: LearningPathItemType) => {
    if (!searchKeyword) return true;
    const matchesSearch =
      path.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  const handleSearch = () => {
    setIsClientFiltering(true);
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setIsClientFiltering(true);
    setPage(newPage);
  };

  const showLoading = isClientFiltering && isLoading;

  if (showLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[400px] md:min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center px-4 text-center md:min-h-[500px]">
          <h1 className="mb-4 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mb-12 text-base text-white/90 md:text-lg max-w-3xl">
            {t("heroDescription")}
          </p>

          {/* Search Box */}
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-left text-lg font-semibold text-foreground">
              {t("searchTitle") || "What learning path are you looking for?"}
            </h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 pl-10 border-input bg-muted"
                />
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="h-12 px-8 text-base font-semibold"
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths Content */}
      <div className="container mx-auto max-w-7xl py-16 px-4 space-y-8">
        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showingResults", {
              count: filteredPaths.length,
              total: pagination?.totalElements ?? paths.length,
            })}
          </p>
        </div>

        {/* Learning Paths Grid */}
        {filteredPaths.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("noResults")}</h3>
            <p className="text-muted-foreground">{t("noResultsDescription")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaths.map((path: LearningPathItemType) => (
              <Card
                key={path.id}
                className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden flex flex-col h-full"
              >
                <CardHeader className="space-y-3 flex-shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                        {path.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3 min-h-[4.5rem]">
                    {path.description || t("noDescription")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {/* Stats */}
                  <div className="flex items-center gap-2 text-sm pt-4 border-t">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {path.courses?.length || 0} {t("courses")}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2 flex-1">
                    {path.skills && path.skills.length > 0 ? (
                      <>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {t("skills")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {path.skills.slice(0, 4).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {path.skills.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{path.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="min-h-[3rem]"></div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/learning-paths/${path.id}`} className="block mt-auto">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t("viewPath")}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <PublicPagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            previousLabel={t("previous")}
            nextLabel={t("next")}
            className="pt-8"
          />
        )}
      </div>
    </>
  );
}
