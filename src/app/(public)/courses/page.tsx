"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetCourseList, useGetSkills, useGetTags } from "@/queries/useCourse";
import { formatPrice, formatCourseLevel, formatLanguage, createCourseSlug } from "@/lib/course";

const LEVELS = [
  { value: "ALL_LEVELS", label: "Tất cả cấp độ" },
  { value: "BEGINNER", label: "Người mới bắt đầu" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
  { value: "EXPERT", label: "Chuyên gia" },
];

const LANGUAGES = [
  { value: "VI", label: "Tiếng Việt" },
  { value: "EN", label: "English" },
  { value: "JA", label: "日本語" },
];

export default function CoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [page, setPage] = useState(0);
  const [size] = useState(12);

  // Fetch data
  const { data: skillsData } = useGetSkills();
  const { data: tagsData } = useGetTags();
  const skills = skillsData?.payload?.data ?? [];
  const tags = tagsData?.payload?.data ?? [];

  // Build filter params
  const filterParams = {
    page,
    size,
    search: searchQuery || undefined,
    level: selectedLevel && selectedLevel !== "ALL" ? selectedLevel : undefined,
    language: selectedLanguage && selectedLanguage !== "ALL" ? selectedLanguage : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
    skillIds: selectedSkills.length > 0 ? selectedSkills : undefined,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
  };

  console.log("========== FRONTEND FILTER PARAMS ==========");
  console.log("Filter params:", JSON.stringify(filterParams, null, 2));
  console.log("Selected skills count:", selectedSkills.length);
  console.log("Selected tags count:", selectedTags.length);

  const { data: coursesResponse, isLoading, error } = useGetCourseList(filterParams);
  
  console.log("Courses API response:", coursesResponse);
  console.log("Is loading:", isLoading);
  if (error) {
    console.error("API Error:", error);
  }
  
  const courses = coursesResponse?.payload?.data ?? [];
  const pagination = coursesResponse?.payload?.pagination;

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
    setPage(0);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("ALL");
    setSelectedLanguage("ALL");
    setSelectedSkills([]);
    setSelectedTags([]);
    setPriceRange([0, 10000000]);
    setPage(0);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedLevel && selectedLevel !== "ALL" ? 1 : 0) +
    (selectedLanguage && selectedLanguage !== "ALL" ? 1 : 0) +
    selectedSkills.length +
    selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0);

  return (
    <main className="min-h-screen bg-background pb-20 pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Khám phá khóa học</h1>
          <p className="mb-6 text-lg text-white/90">
            Tìm kiếm và lọc các khóa học phù hợp với nhu cầu của bạn
          </p>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="h-12 pl-10 text-base"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="lg" className="relative">
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  Bộ lọc
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Bộ lọc khóa học</SheetTitle>
                  <SheetDescription>
                    Tùy chỉnh tiêu chí tìm kiếm của bạn
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Level Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Cấp độ</label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        {LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Ngôn ngữ</label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Khoảng giá: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      min={0}
                      max={10000000}
                      step={100000}
                      value={priceRange}
                      onValueChange={(value: number[]) => setPriceRange(value as [number, number])}
                      className="mt-2"
                    />
                  </div>

                  {/* Skills Filter */}
                  {skills.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Kỹ năng ({selectedSkills.length})
                      </label>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                        {skills.map((skill: any) => (
                          <div key={skill.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`skill-${skill.id}`}
                              checked={selectedSkills.includes(skill.id)}
                              onCheckedChange={() => handleSkillToggle(skill.id)}
                            />
                            <label
                              htmlFor={`skill-${skill.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {skill.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Filter */}
                  {tags.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Thẻ ({selectedTags.length})
                      </label>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                        {tags.map((tag: any) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => handleTagToggle(tag.id)}
                            />
                            <label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {tag.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleClearFilters}
                    disabled={activeFiltersCount === 0}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container mx-auto px-4 py-12">
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Bộ lọc đang áp dụng:</span>
            {selectedLevel && selectedLevel !== "ALL" && (
              <Badge variant="secondary" className="gap-1">
                {LEVELS.find((l) => l.value === selectedLevel)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedLevel("ALL")}
                />
              </Badge>
            )}
            {selectedLanguage && selectedLanguage !== "ALL" && (
              <Badge variant="secondary" className="gap-1">
                {LANGUAGES.find((l) => l.value === selectedLanguage)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedLanguage("ALL")}
                />
              </Badge>
            )}
            {selectedSkills.map((skillId) => {
              const skill = skills.find((s: any) => s.id === skillId);
              return skill ? (
                <Badge key={skillId} variant="secondary" className="gap-1">
                  {skill.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleSkillToggle(skillId)}
                  />
                </Badge>
              ) : null;
            })}
            {selectedTags.map((tagId) => {
              const tag = tags.find((t: any) => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="outline" className="gap-1">
                  #{tag.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleTagToggle(tagId)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}

        {/* Results Count */}
        {pagination && (
          <p className="mb-4 text-sm text-muted-foreground">
            Tìm thấy {pagination.totalElements} khóa học
          </p>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="mb-4 h-4 w-full" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && courses.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: any) => {
              const slug = createCourseSlug(course.title, course.id);
              return (
                <Card
                  key={course.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                  onClick={() => router.push(`/courses/${slug}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                    {course.thumbnail?.url ? (
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
                        {course.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold group-hover:text-purple-600">
                      {course.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>

                    {/* Stats */}
                    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>⭐ {course.averageRating?.toFixed(1) || "N/A"}</span>
                      <span>👥 {course.totalEnrollments || 0}</span>
                      <span>{formatCourseLevel(course.level)}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      {course.discountPrice ? (
                        <div>
                          <span className="text-lg font-bold text-purple-600">
                            {formatPrice(course.discountPrice)}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground line-through">
                            {formatPrice(course.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-purple-600">
                          {formatPrice(course.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <Card className="p-12 text-center">
            <p className="mb-2 text-lg font-medium">Không tìm thấy khóa học nào</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn
            </p>
            <Button onClick={handleClearFilters}>Xóa bộ lọc</Button>
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPrevious}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "outline"}
                  onClick={() => setPage(i)}
                  className="h-10 w-10 p-0"
                >
                  {i + 1}
                </Button>
              )).slice(
                Math.max(0, page - 2),
                Math.min(pagination.totalPages, page + 3)
              )}
            </div>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
