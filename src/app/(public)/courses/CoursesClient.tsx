"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { formatPrice, formatCourseLevel, createCourseSlug } from "@/lib/course";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

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

const COURSE_SELECT_TRIGGER_CLASS =
  "h-12 border-border bg-background text-foreground shadow-sm data-[placeholder]:text-muted-foreground hover:bg-muted focus:ring-ring";
const FILTER_SELECT_TRIGGER_CLASS =
  "h-11 border-border bg-background text-foreground shadow-sm data-[placeholder]:text-muted-foreground hover:bg-muted focus:ring-ring";
const COURSE_SELECT_CONTENT_CLASS =
  "border-border bg-popover text-popover-foreground shadow-lg";
const COURSE_SELECT_ITEM_CLASS =
  "text-popover-foreground focus:bg-accent focus:text-accent-foreground";

interface CoursesClientProps {
  initialCourses: any[];
  initialSkills: any[];
  initialTags: any[];
  initialPagination: any;
}

export default function CoursesClient({
  initialCourses,
  initialSkills,
  initialTags,
  initialPagination,
}: CoursesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get("search") ?? "";
  const initialSelectedSkills = searchParams
    .getAll("skillIds")
    .flatMap((value) => value.split(","))
    .filter(Boolean);
  const hasInitialFilters =
    initialSearchQuery.length > 0 || initialSelectedSkills.length > 0;

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialSelectedSkills
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [isClientFiltering, setIsClientFiltering] = useState(hasInitialFilters);

  // Fetch skills and tags (use initial data if available)
  const { data: skillsData } = useGetSkills();
  const { data: tagsData } = useGetTags();
  const skills = skillsData?.payload?.data ?? initialSkills;
  const tags = tagsData?.payload?.data ?? initialTags;

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

  const { data: coursesResponse, isLoading } = useGetCourseList(filterParams);

  // Use SSR data for initial render, client data after filtering
  const courses = isClientFiltering 
    ? (coursesResponse?.payload?.data ?? [])
    : (coursesResponse?.payload?.data ?? initialCourses);
  const pagination = isClientFiltering 
    ? coursesResponse?.payload?.pagination
    : (coursesResponse?.payload?.pagination ?? initialPagination);

  const handleSkillToggle = (skillId: string) => {
    setIsClientFiltering(true);
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
    setPage(0);
  };

  const handleTagToggle = (tagId: string) => {
    setIsClientFiltering(true);
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
    setIsClientFiltering(false);
  };

  const handleSearch = (value: string) => {
    setIsClientFiltering(true);
    setSearchQuery(value);
    setPage(0);
  };

  const handleLevelChange = (value: string) => {
    setIsClientFiltering(true);
    setSelectedLevel(value);
    setPage(0);
  };

  const handleLanguageChange = (value: string) => {
    setIsClientFiltering(true);
    setSelectedLanguage(value);
    setPage(0);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedLevel && selectedLevel !== "ALL" ? 1 : 0) +
    (selectedLanguage && selectedLanguage !== "ALL" ? 1 : 0) +
    selectedSkills.length +
    selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0);

  const showLoading = isClientFiltering && isLoading;

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[400px] md:min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/courses/courses.png"
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
            Build job-ready technology skills.
          </h1>
          <p className="mb-12 text-base text-white/90 md:text-lg">
            Become professionals and ready to join the world.
          </p>

          {/* Search Box */}
          <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-left text-lg font-semibold text-foreground">
              What do you want to learn?
            </h3>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Find courses, skills, software, etc"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-12 border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Categories Dropdown */}
              <div className="w-full md:w-44">
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className={COURSE_SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder="Categories" />
                  </SelectTrigger>
                  <SelectContent className={COURSE_SELECT_CONTENT_CLASS}>
                    <SelectItem value="ALL" className={COURSE_SELECT_ITEM_CLASS}>
                      Tất cả
                    </SelectItem>
                    {LEVELS.map((level) => (
                      <SelectItem
                        key={level.value}
                        value={level.value}
                        className={COURSE_SELECT_ITEM_CLASS}
                      >
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Dropdown */}
              <div className="w-full md:w-44">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className={COURSE_SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent className={COURSE_SELECT_CONTENT_CLASS}>
                    <SelectItem value="ALL" className={COURSE_SELECT_ITEM_CLASS}>
                      Tất cả
                    </SelectItem>
                    {LANGUAGES.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className={COURSE_SELECT_ITEM_CLASS}
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                style={{ backgroundColor: "#3dcbb1" }}
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-gray-50 py-4 dark:bg-gray-900">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {activeFiltersCount} bộ lọc đang áp dụng
              </span>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="relative"
                style={{ borderColor: "#3dcbb1", color: "#3dcbb1" }}
              >
                <SlidersHorizontal className="mr-2 h-5 w-5" />
                Bộ lọc nâng cao
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
            <SheetContent className="w-full overflow-y-auto bg-background text-foreground sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Bộ lọc khóa học</SheetTitle>
                <SheetDescription>Tùy chỉnh tiêu chí tìm kiếm của bạn</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Level Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Cấp độ</label>
                  <Select value={selectedLevel} onValueChange={handleLevelChange}>
                    <SelectTrigger className={FILTER_SELECT_TRIGGER_CLASS}>
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                    <SelectContent className={COURSE_SELECT_CONTENT_CLASS}>
                      <SelectItem value="ALL" className={COURSE_SELECT_ITEM_CLASS}>
                        Tất cả
                      </SelectItem>
                      {LEVELS.map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value}
                          className={COURSE_SELECT_ITEM_CLASS}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Ngôn ngữ</label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className={FILTER_SELECT_TRIGGER_CLASS}>
                      <SelectValue placeholder="Chọn ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent className={COURSE_SELECT_CONTENT_CLASS}>
                      <SelectItem value="ALL" className={COURSE_SELECT_ITEM_CLASS}>
                        Tất cả
                      </SelectItem>
                      {LANGUAGES.map((lang) => (
                        <SelectItem
                          key={lang.value}
                          value={lang.value}
                          className={COURSE_SELECT_ITEM_CLASS}
                        >
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
                    onValueChange={(value: number[]) => {
                      setIsClientFiltering(true);
                      setPriceRange(value as [number, number]);
                    }}
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
                  onClick={() => handleLevelChange("ALL")}
                />
              </Badge>
            )}
            {selectedLanguage && selectedLanguage !== "ALL" && (
              <Badge variant="secondary" className="gap-1">
                {LANGUAGES.find((l) => l.value === selectedLanguage)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleLanguageChange("ALL")}
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
        {showLoading && (
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
        {!showLoading && courses.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: any) => {
              const slug = createCourseSlug(course.title, course.id);
              const thumbnailUrl = normalizePersistedMediaUrl(
                course.thumbnail?.secureUrl || course.thumbnail?.url
              );
              return (
                <Card
                  key={course.id}
                  className="group cursor-pointer overflow-hidden border-border transition-colors hover:border-primary/40"
                  onClick={() => router.push(`/courses/${slug}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
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
                    <h3 className="mb-2 line-clamp-2 font-semibold group-hover:text-primary">
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
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(course.discountPrice)}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground line-through">
                            {formatPrice(course.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-primary">
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
        {!showLoading && courses.length === 0 && (
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
              onClick={() => {
                setIsClientFiltering(true);
                setPage(page - 1);
              }}
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "outline"}
                  onClick={() => {
                    setIsClientFiltering(true);
                    setPage(i);
                  }}
                  className="h-10 w-10 p-0"
                >
                  {i + 1}
                </Button>
              )).slice(Math.max(0, page - 2), Math.min(pagination.totalPages, page + 3))}
            </div>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => {
                setIsClientFiltering(true);
                setPage(page + 1);
              }}
            >
              Sau
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
