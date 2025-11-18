"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetLearningPathList } from "@/queries/useLearningPath";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { LearningPathItemType } from "@/schemaValidations/learning-path.schema";

export default function LearningPathList() {
  const t = useTranslations("LearningPaths");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useGetLearningPathList({
    page,
    size: 9,
    sortBy: "created",
    sortDirection: "DESC",
  });

  const paths = data?.payload?.data || [];
  const pagination = data?.payload?.pagination;

  const filteredPaths = paths.filter((path: LearningPathItemType) => {
    const matchesSearch = 
      path.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("showingResults", { count: filteredPaths.length, total: paths.length })}
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
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {path.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {path.description || t("noDescription")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-2 text-sm pt-4 border-t">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {path.courses?.length || 0} {t("courses")}
                  </span>
                </div>

                {/* Skills */}
                {path.skills && path.skills.length > 0 && (
                  <div className="space-y-2">
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
                  </div>
                )}

                {/* Action Button */}
                <Link href={`/learning-paths/${path.id}`} className="block">
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
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("page")} {page + 1} {t("of")} {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages - 1}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
