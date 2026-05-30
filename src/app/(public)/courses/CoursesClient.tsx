"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowDownUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import CourseCardWithInstructor from "@/components/molecules/CourseCardWithInstructor";
import { PublicPagination } from "@/components/common/public-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useGetCourseList, useGetSkills, useGetTags } from "@/queries/useCourse";
import { formatPrice } from "@/lib/course";
import { normalizePublicMediaUrl } from "@/lib/file-media";

type FilterOption = {
  value: string;
  labelKey?: string;
  label?: string;
};

const LEVELS: FilterOption[] = [
  { value: "BEGINNER", labelKey: "beginner" },
  { value: "INTERMEDIATE", labelKey: "intermediate" },
  { value: "ADVANCED", labelKey: "advanced" },
];

const LANGUAGES: FilterOption[] = [
  { value: "VI", labelKey: "vietnamese" },
  { value: "EN", labelKey: "english" },
  { value: "JA", labelKey: "japanese" },
];

const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "popular", labelKey: "sortPopular" },
  { value: "rating", labelKey: "sortRating" },
  { value: "price-asc", labelKey: "sortPriceAsc" },
  { value: "price-desc", labelKey: "sortPriceDesc" },
];

const DEFAULT_PRICE_CURRENCY = "VND";
const DEFAULT_PRICE_MAX_BY_CURRENCY: Record<string, number> = {
  VND: 1_000_000,
  USD: 1_000,
};
const PRICE_STEP_BY_CURRENCY: Record<string, number> = {
  VND: 50_000,
  USD: 25,
};
const CATALOG_FETCH_SIZE = 100;
const CATALOG_PAGE_SIZE = 9;

const SELECT_TRIGGER_CLASS =
  "h-11 border-border bg-background text-foreground shadow-sm data-[placeholder]:text-muted-foreground hover:bg-muted focus:ring-ring";
const SELECT_CONTENT_CLASS = "border-border bg-popover text-popover-foreground shadow-lg";
const SELECT_ITEM_CLASS = "text-popover-foreground focus:bg-accent focus:text-accent-foreground";

interface CoursesClientProps {
  initialCourses: any[];
  initialSkills: any[];
  initialTags: any[];
  initialPagination: any;
}

function readMultiSearchParam(searchParams: ReturnType<typeof useSearchParams>, key: string) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .filter(Boolean);
}

function getEffectivePrice(course: any) {
  const originalPrice = Number(course.price ?? 0);
  const discountPrice = Number(course.discountPrice ?? 0);
  return discountPrice > 0 && discountPrice < originalPrice ? discountPrice : originalPrice;
}

function getCourseCurrency(courses: any[]) {
  return (
    courses
      .map((course) => String(course?.currency ?? "").trim().toUpperCase())
      .find(Boolean) ?? DEFAULT_PRICE_CURRENCY
  );
}

function getPriceStep(currency: string) {
  return PRICE_STEP_BY_CURRENCY[currency] ?? PRICE_STEP_BY_CURRENCY.USD;
}

function getDefaultPriceMax(currency: string) {
  return DEFAULT_PRICE_MAX_BY_CURRENCY[currency] ?? DEFAULT_PRICE_MAX_BY_CURRENCY.USD;
}

function roundUpToStep(value: number, step: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.ceil(value / step) * step;
}

function getPriceFilterMeta(courses: any[]) {
  const currency = getCourseCurrency(courses);
  const step = getPriceStep(currency);
  const maxCoursePrice = Math.max(...courses.map(getEffectivePrice), 0);
  const maxPrice = maxCoursePrice > 0
    ? roundUpToStep(maxCoursePrice, step)
    : getDefaultPriceMax(currency);

  return { currency, maxPrice, step };
}

function buildPricePresets(
  maxPrice: number,
  currency: string,
  t: ReturnType<typeof useTranslations>
) {
  const step = getPriceStep(currency);
  const midpoint = Math.max(step, roundUpToStep(maxPrice * 0.5, step));

  return [
    { value: "all", label: t("priceAll"), range: [0, maxPrice] as [number, number] },
    { value: "free", label: t("priceFree"), range: [0, 0] as [number, number] },
    {
      value: "under-midpoint",
      label: `<= ${formatPrice(midpoint, currency)}`,
      range: [0, midpoint] as [number, number],
    },
    {
      value: "from-midpoint",
      label: `>= ${formatPrice(midpoint, currency)}`,
      range: [midpoint, maxPrice] as [number, number],
    },
  ];
}

function sortCourses(courses: any[], sortBy: string) {
  return [...courses].sort((a, b) => {
    if (sortBy === "popular") {
      return Number(b.totalEnrollments ?? 0) - Number(a.totalEnrollments ?? 0);
    }
    if (sortBy === "rating") {
      return Number(b.averageRating ?? 0) - Number(a.averageRating ?? 0);
    }
    if (sortBy === "price-asc") {
      return getEffectivePrice(a) - getEffectivePrice(b);
    }
    if (sortBy === "price-desc") {
      return getEffectivePrice(b) - getEffectivePrice(a);
    }
    return new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime();
  });
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(course: any, searchQuery: string) {
  const query = normalizeSearchText(searchQuery);
  if (!query) {
    return true;
  }

  const searchableText = [
    course?.title,
    course?.description,
    ...(Array.isArray(course?.categories) ? course.categories : []),
    ...(Array.isArray(course?.skills) ? course.skills.map((skill: any) => skill?.name) : []),
    ...(Array.isArray(course?.tags) ? course.tags.map((tag: any) => tag?.name) : []),
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchableText.includes(query);
}

function getRelationValues(items: any[] | undefined) {
  return new Set(
    (items ?? [])
      .flatMap((item) => [
        item?.id,
        item?.skillId,
        item?.tagId,
        item?.name,
        typeof item === "string" ? item : undefined,
      ])
      .map((value) => String(value ?? ""))
      .filter(Boolean)
  );
}

function expandSelectedRelationValues(selectedIds: string[], options: any[]) {
  const selectedValues = new Set(selectedIds);

  selectedIds.forEach((selectedId) => {
    const option = options.find((item) => String(item?.id ?? "") === selectedId);
    if (option?.name) {
      selectedValues.add(String(option.name));
    }
  });

  return selectedValues;
}

function matchesSelectedIds(items: any[] | undefined, selectedIds: string[], options: any[] = []) {
  if (selectedIds.length === 0) {
    return true;
  }

  const itemValues = getRelationValues(items);
  const selectedValues = expandSelectedRelationValues(selectedIds, options);

  return Array.from(selectedValues).some((selectedValue) => itemValues.has(selectedValue));
}

function getAvailableRelationOptions(courses: any[], options: any[], field: "skills" | "tags") {
  const existingValues = courses.reduce((values, course) => {
    getRelationValues(course?.[field]).forEach((value) => values.add(value));
    return values;
  }, new Set<string>());

  if (existingValues.size === 0) {
    return options;
  }

  const availableOptions = options.filter((option) => {
    const id = String(option?.id ?? "");
    const name = String(option?.name ?? "");
    return existingValues.has(id) || existingValues.has(name);
  });

  return availableOptions.length > 0 ? availableOptions : options;
}

function matchesPrice(course: any, priceRange: [number, number]) {
  const price = getEffectivePrice(course);
  return price >= priceRange[0] && price <= priceRange[1];
}

function formatFilterValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFilterOptionLabel(option: FilterOption, t: ReturnType<typeof useTranslations>) {
  return option.labelKey ? t(option.labelKey) : option.label ?? formatFilterValue(option.value);
}

function getFilterOptionByValue(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value) ?? {
    value,
    label: formatFilterValue(value),
  };
}

function getAvailableFilterOptions(
  courses: any[],
  options: FilterOption[],
  field: "level" | "language"
) {
  const existingValues = new Set(
    courses
      .map((course) => String(course?.[field] ?? ""))
      .filter(Boolean)
  );

  if (existingValues.size === 0) {
    return options;
  }

  const knownOptions = options.filter((option) => existingValues.has(option.value));
  const knownValues = new Set(options.map((option) => option.value));
  const dynamicOptions = Array.from(existingValues)
    .filter((value) => !knownValues.has(value))
    .map((value) => ({
      value,
      label: formatFilterValue(value),
    }));

  return [...knownOptions, ...dynamicOptions];
}

function includeSelectedFilterOption(
  options: FilterOption[],
  allOptions: FilterOption[],
  selectedValue: string
) {
  if (selectedValue === "ALL" || options.some((option) => option.value === selectedValue)) {
    return options;
  }

  return [...options, getFilterOptionByValue(allOptions, selectedValue)];
}

export default function CoursesClient({
  initialCourses,
  initialSkills,
  initialTags,
}: CoursesClientProps) {
  const t = useTranslations("courses");
  const searchParams = useSearchParams();

  const initialSearchQuery = searchParams.get("search") ?? "";
  const initialSelectedSkills = readMultiSearchParam(searchParams, "skillIds");
  const initialSelectedTags = readMultiSearchParam(searchParams, "tagIds");
  const initialLevelParam = searchParams.get("level") ?? "ALL";
  const initialLanguageParam = searchParams.get("language") ?? "ALL";
  const initialSelectedLevel = initialLevelParam !== "ALL" ? initialLevelParam : "ALL";
  const initialSelectedLanguage = initialLanguageParam !== "ALL" ? initialLanguageParam : "ALL";
  const initialPriceFilterMeta = getPriceFilterMeta(initialCourses);
  const hasInitialPriceFilter = searchParams.has("minPrice") || searchParams.has("maxPrice");
  const initialMinPrice = Number(searchParams.get("minPrice") ?? 0);
  const initialMaxPrice = Number(searchParams.get("maxPrice") ?? initialPriceFilterMeta.maxPrice);
  const initialPage = Number(searchParams.get("page") ?? 0);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedLevel, setSelectedLevel] = useState<string>(initialSelectedLevel);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialSelectedLanguage);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSelectedSkills);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number.isFinite(initialMinPrice) ? initialMinPrice : 0,
    Number.isFinite(initialMaxPrice) ? initialMaxPrice : initialPriceFilterMeta.maxPrice,
  ]);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 0);

  const catalogQueryOptions = {
    redirectOnUnauthorized: true,
    retry: false,
  };
  const { data: skillsData } = useGetSkills(catalogQueryOptions);
  const { data: tagsData } = useGetTags(catalogQueryOptions);
  const skills = skillsData?.payload?.data ?? initialSkills;
  const tags = tagsData?.payload?.data ?? initialTags;

  const { data: coursesResponse, isLoading } = useGetCourseList({
    page: 0,
    size: CATALOG_FETCH_SIZE,
    ...catalogQueryOptions,
  });

  const catalogCourses = useMemo(
    () => {
      const responseCourses = coursesResponse?.payload?.data;
      return Array.isArray(responseCourses) && responseCourses.length > 0
        ? responseCourses
        : initialCourses;
    },
    [coursesResponse?.payload?.data, initialCourses]
  );
  const filterSourceCourses = useMemo(
    () => (initialCourses.length > 0 ? initialCourses : catalogCourses),
    [catalogCourses, initialCourses]
  );
  const priceFilterMeta = useMemo(
    () => getPriceFilterMeta(filterSourceCourses),
    [filterSourceCourses]
  );
  const maxPrice = priceFilterMeta.maxPrice;
  const priceCurrency = priceFilterMeta.currency;
  const priceStep = priceFilterMeta.step;
  const pricePresets = useMemo(
    () => buildPricePresets(maxPrice, priceCurrency, t),
    [maxPrice, priceCurrency, t]
  );

  useEffect(() => {
    setPriceRange((current) => {
      const [min, max] = current;
      if (!hasInitialPriceFilter && min === 0 && max !== maxPrice) {
        return [0, maxPrice];
      }

      const nextMin = Math.max(0, Math.min(min, maxPrice));
      const nextMax = Math.max(nextMin, Math.min(max, maxPrice));
      return nextMin === min && nextMax === max ? current : [nextMin, nextMax];
    });
  }, [hasInitialPriceFilter, maxPrice]);

  const filteredCourses = useMemo(
    () =>
      catalogCourses.filter((course: any) => {
        if (!matchesSearch(course, searchQuery)) {
          return false;
        }
        if (selectedLevel !== "ALL" && course?.level !== selectedLevel) {
          return false;
        }
        if (selectedLanguage !== "ALL" && course?.language !== selectedLanguage) {
          return false;
        }
        if (!matchesPrice(course, priceRange)) {
          return false;
        }
        if (!matchesSelectedIds(course?.skills, selectedSkills, skills)) {
          return false;
        }
        if (!matchesSelectedIds(course?.tags, selectedTags, tags)) {
          return false;
        }

        return true;
      }),
    [catalogCourses, priceRange, searchQuery, selectedLanguage, selectedLevel, selectedSkills, selectedTags, skills, tags]
  );
  const sortedCourses = useMemo(() => sortCourses(filteredCourses, sortBy), [filteredCourses, sortBy]);
  const visibleTotalPages = Math.max(1, Math.ceil(sortedCourses.length / CATALOG_PAGE_SIZE));
  const courses = useMemo(
    () => sortedCourses.slice(page * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE + CATALOG_PAGE_SIZE),
    [page, sortedCourses]
  );
  const availableLevelOptions = useMemo(
    () =>
      includeSelectedFilterOption(
        getAvailableFilterOptions(filterSourceCourses, LEVELS, "level"),
        LEVELS,
        selectedLevel
      ),
    [filterSourceCourses, selectedLevel]
  );
  const availableLanguageOptions = useMemo(
    () =>
      includeSelectedFilterOption(
        getAvailableFilterOptions(filterSourceCourses, LANGUAGES, "language"),
        LANGUAGES,
        selectedLanguage
      ),
    [filterSourceCourses, selectedLanguage]
  );
  const availableSkills = useMemo(
    () => getAvailableRelationOptions(filterSourceCourses, skills, "skills"),
    [filterSourceCourses, skills]
  );
  const availableTags = useMemo(
    () => getAvailableRelationOptions(filterSourceCourses, tags, "tags"),
    [filterSourceCourses, tags]
  );
  useEffect(() => {
    if (page > 0 && page >= visibleTotalPages) {
      setPage(0);
    }
  }, [page, visibleTotalPages]);

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
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
    setPage(0);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedLevel !== "ALL" ? 1 : 0) +
    (selectedLanguage !== "ALL" ? 1 : 0) +
    selectedSkills.length +
    selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const showLoading = isLoading && catalogCourses.length === 0;
  const priceLabel = `${formatPrice(priceRange[0], priceCurrency)} - ${formatPrice(priceRange[1], priceCurrency)}`;
  const showPagination = visibleTotalPages > 1 && sortedCourses.length > 0;

  const toHomeCardCourse = (course: any) => {
    const thumbnailUrl = normalizePublicMediaUrl(
      course.thumbnail?.secureUrl || course.thumbnail?.url
    ) || null;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      instructorId: course.instructorId,
      image: thumbnailUrl,
      rating: Number(course.averageRating ?? 0),
      reviews: Number(course.ratingCount ?? 0),
      price: Number(course.discountPrice || course.price || 0),
      originalPrice: Number(course.price || 0),
      currency: course.currency,
      badge: course.categories?.[0] || "",
      level: course.level,
      language: course.language,
      hours: course.totalEstimatedDurationMinutes
        ? Math.round((Number(course.totalEstimatedDurationMinutes) / 60) * 10) / 10
        : 0,
      lectures: 0,
      lessons: Number(course.totalLessons ?? 0),
      students: Number(course.totalEnrollments ?? 0),
      skills: course.skills || [],
      promoEndDate: course.promoEndDate,
      createdAt: course.created,
    };
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <section className="relative min-h-[390px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/85" />
        </div>

        <div className="relative z-10 flex min-h-[390px] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="mb-4 max-w-4xl text-3xl font-bold italic leading-tight text-white drop-shadow-sm md:text-5xl">
            {t("catalogHeroTitle")}
          </h1>
          <p className="mb-10 max-w-2xl text-base leading-7 text-white drop-shadow-sm md:text-lg">
            {t("catalogHeroSubtitle")}
          </p>

          <div className="w-full max-w-5xl rounded-xl border border-white/12 bg-card p-4 text-left shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">
                {t("searchTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("searchDescription")}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_120px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(0);
                  }}
                  className="h-11 border-border bg-background pl-9 text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Select
                value={selectedLevel}
                onValueChange={(value) => {
                  setSelectedLevel(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder={t("level")} />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS}>
                  <SelectItem value="ALL" className={SELECT_ITEM_CLASS}>
                    {t("allLevels")}
                  </SelectItem>
                  {availableLevelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value} className={SELECT_ITEM_CLASS}>
                      {getFilterOptionLabel(level, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedLanguage}
                onValueChange={(value) => {
                  setSelectedLanguage(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder={t("language")} />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS}>
                  <SelectItem value="ALL" className={SELECT_ITEM_CLASS}>
                    {t("allLanguages")}
                  </SelectItem>
                  {availableLanguageOptions.map((language) => (
                    <SelectItem key={language.value} value={language.value} className={SELECT_ITEM_CLASS}>
                      {getFilterOptionLabel(language, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="h-11 gap-2 font-semibold"
                onClick={() => {
                  setPage(0);
                }}
              >
                <Search className="h-4 w-4" />
                {t("searchButton")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/60 py-4">
        <div className="container mx-auto flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-[190px] border-border bg-background">
                <ArrowDownUp className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CLASS}>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CLASS}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                {t("activeFilters", { count: activeFiltersCount })}
              </span>
            ) : null}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative h-10 shrink-0 gap-2 rounded-full px-5">
                <SlidersHorizontal className="h-4 w-4" />
                {t("advancedFilters")}
                {activeFiltersCount > 0 ? (
                  <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                    {activeFiltersCount}
                  </Badge>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto bg-background text-foreground sm:max-w-md">
              <SheetHeader>
                <SheetTitle>{t("filterTitle")}</SheetTitle>
                <SheetDescription>{t("filterDescription")}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t("priceRange")}</label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {pricePresets.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1] ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setPriceRange(preset.range);
                          setPage(0);
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="mb-4 text-sm font-medium">{priceLabel}</p>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={priceStep}
                      value={priceRange}
                      onValueChange={(value: number[]) => {
                        setPriceRange(value as [number, number]);
                        setPage(0);
                      }}
                    />
                  </div>
                </div>

                {availableSkills.length > 0 ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t("skills")} ({selectedSkills.length})
                    </label>
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
                      {availableSkills.map((skill: any) => (
                        <div key={skill.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/70">
                          <Checkbox
                            id={`skill-${skill.id}`}
                          checked={selectedSkills.includes(String(skill.id))}
                          onCheckedChange={() => handleSkillToggle(String(skill.id))}
                          />
                          <label htmlFor={`skill-${skill.id}`} className="cursor-pointer text-sm font-medium">
                            {skill.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {availableTags.length > 0 ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t("tags")} ({selectedTags.length})
                    </label>
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
                      {availableTags.map((tag: any) => (
                        <div key={tag.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/70">
                          <Checkbox
                            id={`tag-${tag.id}`}
                          checked={selectedTags.includes(String(tag.id))}
                          onCheckedChange={() => handleTagToggle(String(tag.id))}
                          />
                          <label htmlFor={`tag-${tag.id}`} className="cursor-pointer text-sm font-medium">
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleClearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  <X className="h-4 w-4" />
                  {t("clearFilters")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {activeFiltersCount > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{t("appliedFilters")}</span>
            {searchQuery ? (
              <Badge variant="secondary" className="gap-1 rounded-full">
                {searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(0);
                  }}
                />
              </Badge>
            ) : null}
            {selectedLevel !== "ALL" ? (
              <Badge variant="secondary" className="gap-1 rounded-full">
                {getFilterOptionLabel(getFilterOptionByValue(availableLevelOptions, selectedLevel), t)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSelectedLevel("ALL");
                    setPage(0);
                  }}
                />
              </Badge>
            ) : null}
            {selectedLanguage !== "ALL" ? (
              <Badge variant="secondary" className="gap-1 rounded-full">
                {getFilterOptionLabel(getFilterOptionByValue(availableLanguageOptions, selectedLanguage), t)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSelectedLanguage("ALL");
                    setPage(0);
                  }}
                />
              </Badge>
            ) : null}
            {priceRange[0] > 0 || priceRange[1] < maxPrice ? (
              <Badge variant="secondary" className="gap-1 rounded-full">
                {priceLabel}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setPriceRange([0, maxPrice]);
                    setPage(0);
                  }}
                />
              </Badge>
            ) : null}
            {selectedSkills.map((skillId) => {
              const skill = skills.find((item: any) => String(item.id) === skillId);
              return skill ? (
                <Badge key={skillId} variant="secondary" className="gap-1 rounded-full">
                  {skill.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleSkillToggle(skillId)} />
                </Badge>
              ) : null;
            })}
            {selectedTags.map((tagId) => {
              const tag = tags.find((item: any) => String(item.id) === tagId);
              return tag ? (
                <Badge key={tagId} variant="outline" className="gap-1 rounded-full">
                  #{tag.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagToggle(tagId)} />
                </Badge>
              ) : null;
            })}
            <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={handleClearFilters}>
              {t("clearFilters")}
            </Button>
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t("resultCount", { count: sortedCourses.length })}
          </p>
        </div>

        {showLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-border/70 bg-card p-2.5">
                <Skeleton className="aspect-[1.7/1] w-full rounded-lg" />
                <div className="space-y-4 p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {!showLoading && courses.length > 0 ? (
          <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course: any) => (
              <CourseCardWithInstructor
                key={course.id}
                course={toHomeCardCourse(course)}
                variant="showcase"
              />
            ))}
          </div>
        ) : null}

        {!showLoading && courses.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="mb-2 text-lg font-medium">{t("emptyTitle")}</p>
            <p className="mb-4 text-sm text-muted-foreground">{t("emptyDescription")}</p>
            <Button onClick={handleClearFilters}>{t("clearFilters")}</Button>
          </Card>
        ) : null}

        {showPagination ? (
          <PublicPagination
            page={page}
            totalPages={visibleTotalPages}
            onPageChange={setPage}
            previousLabel={t("previous")}
            nextLabel={t("next")}
            className="mt-8"
          />
        ) : null}
      </section>
    </main>
  );
}
