"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Filter, X, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SkillItemType,
  TagItemType,
} from "@/schemaValidations/course.schema";

interface CourseFiltersProps {
  availableSkills?: SkillItemType[];
  availableTags?: TagItemType[];
}

export default function CourseFilters({
  availableSkills = [],
  availableTags = [],
}: CourseFiltersProps) {
  const t = useTranslations("ManageCourse");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const status = searchParams.get("status") || "";
  const level = searchParams.get("level") || "";
  const language = searchParams.get("language") || "";
  const skillIdsParam = searchParams.get("skillIds") || "";
  const tagIdsParam = searchParams.get("tagIds") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    skillIdsParam ? skillIdsParam.split(",").filter(Boolean) : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    tagIdsParam ? tagIdsParam.split(",").filter(Boolean) : []
  );
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setSelectedSkills(skillIdsParam ? skillIdsParam.split(",").filter(Boolean) : []);
    setSelectedTags(tagIdsParam ? tagIdsParam.split(",").filter(Boolean) : []);
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [skillIdsParam, tagIdsParam, minPrice, maxPrice]);

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSkillToggle = (skillId: string) => {
    const nextSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter((id) => id !== skillId)
      : [...selectedSkills, skillId];

    setSelectedSkills(nextSkills);
    updateUrlParams({ skillIds: nextSkills.join(",") || null });
  };

  const handleTagToggle = (tagId: string) => {
    const nextTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(nextTags);
    updateUrlParams({ tagIds: nextTags.join(",") || null });
  };

  const handleClearAllFilters = () => {
    setSelectedSkills([]);
    setSelectedTags([]);
    setLocalMinPrice("");
    setLocalMaxPrice("");
    router.push(pathname);
  };

  const activeFiltersCount = [
    status ? 1 : 0,
    level ? 1 : 0,
    language ? 1 : 0,
    selectedSkills.length,
    selectedTags.length,
    minPrice ? 1 : 0,
    maxPrice ? 1 : 0,
  ].reduce((sum, current) => sum + current, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status || "ALL"}
        onValueChange={(value) =>
          updateUrlParams({ status: value === "ALL" ? null : value })
        }
      >
        <SelectTrigger className="manage-filter-trigger w-[170px]">
          <SelectValue placeholder={t("AllStatus")} />
        </SelectTrigger>
        <SelectContent className="manage-popover-panel">
          <SelectItem value="ALL">{t("AllStatus")}</SelectItem>
          <SelectItem value="DRAFT">{t("Status.DRAFT")}</SelectItem>
          <SelectItem value="PUBLISHED">{t("Status.PUBLISHED")}</SelectItem>
          <SelectItem value="ARCHIVED">{t("Status.ARCHIVED")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={level || "ALL"}
        onValueChange={(value) =>
          updateUrlParams({ level: value === "ALL" ? null : value })
        }
      >
        <SelectTrigger className="manage-filter-trigger w-[170px]">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent className="manage-popover-panel">
          <SelectItem value="ALL">All Levels</SelectItem>
          <SelectItem value="BEGINNER">{t("Level.BEGINNER")}</SelectItem>
          <SelectItem value="INTERMEDIATE">
            {t("Level.INTERMEDIATE")}
          </SelectItem>
          <SelectItem value="ADVANCED">{t("Level.ADVANCED")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={language || "ALL"}
        onValueChange={(value) =>
          updateUrlParams({ language: value === "ALL" ? null : value })
        }
      >
        <SelectTrigger className="manage-filter-trigger w-[170px]">
          <SelectValue placeholder="All Languages" />
        </SelectTrigger>
        <SelectContent className="manage-popover-panel">
          <SelectItem value="ALL">All Languages</SelectItem>
          <SelectItem value="VI">Tiếng Việt</SelectItem>
          <SelectItem value="EN">English</SelectItem>
          <SelectItem value="JA">日本語</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="manage-secondary-button h-11 gap-2 px-4"
            disabled={availableSkills.length === 0}
          >
            <Filter className="h-4 w-4" />
            Skills
            {selectedSkills.length > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {selectedSkills.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        {availableSkills.length > 0 ? (
          <PopoverContent
            align="start"
            className="manage-popover-panel max-h-96 w-80 overflow-y-auto rounded-2xl"
          >
            <div className="space-y-2">
              <h4 className="mb-3 font-medium">Select Skills</h4>
              {availableSkills.map((skill) => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skill.id}`}
                    checked={selectedSkills.includes(skill.id)}
                    onCheckedChange={() => handleSkillToggle(skill.id)}
                  />
                  <label
                    htmlFor={`skill-${skill.id}`}
                    className="flex flex-1 cursor-pointer items-center gap-2"
                  >
                    {skill.thumbnail ? (
                      <img
                        src={skill.thumbnail}
                        alt={skill.name}
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : null}
                    <span className="text-sm">{skill.name}</span>
                    {skill.category ? (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {skill.category}
                      </Badge>
                    ) : null}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        ) : null}
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="manage-secondary-button h-11 gap-2 px-4"
            disabled={availableTags.length === 0}
          >
            <Filter className="h-4 w-4" />
            Tags
            {selectedTags.length > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {selectedTags.length}
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        {availableTags.length > 0 ? (
          <PopoverContent
            align="start"
            className="manage-popover-panel max-h-96 w-64 overflow-y-auto rounded-2xl"
          >
            <div className="space-y-2">
              <h4 className="mb-3 font-medium">Select Tags</h4>
              {availableTags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <label
                    htmlFor={`tag-${tag.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {tag.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        ) : null}
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="manage-secondary-button h-11 gap-2 px-4"
          >
            <Filter className="h-4 w-4" />
            Price
            {minPrice || maxPrice ? (
              <Badge variant="secondary" className="ml-1">
                1
              </Badge>
            ) : null}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="manage-popover-panel w-80 rounded-2xl"
        >
          <div className="space-y-4">
            <h4 className="font-medium">Price Range (USD)</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={localMinPrice}
                  onChange={(event) => setLocalMinPrice(event.target.value)}
                  className="manage-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="0"
                  placeholder="999999"
                  value={localMaxPrice}
                  onChange={(event) => setLocalMaxPrice(event.target.value)}
                  className="manage-field"
                />
              </div>
              <Button
                onClick={() =>
                  updateUrlParams({
                    minPrice: localMinPrice || null,
                    maxPrice: localMaxPrice || null,
                  })
                }
                className="manage-primary-button w-full"
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFiltersCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAllFilters}
          className="manage-secondary-button h-10 gap-2 px-4"
        >
          <X className="h-4 w-4" />
          Clear All ({activeFiltersCount})
        </Button>
      ) : null}
    </div>
  );
}
