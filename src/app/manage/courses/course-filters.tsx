"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Filter, X, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SkillItemType, TagItemType } from "@/schemaValidations/course.schema";

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

  // Get current filter values from URL
  const status = searchParams.get("status") || "";
  const level = searchParams.get("level") || "";
  const language = searchParams.get("language") || "";
  const skillIdsParam = searchParams.get("skillIds") || "";
  const tagIdsParam = searchParams.get("tagIds") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  console.log("🔍 [CourseFilters] Current values:", {
    status,
    level,
    language,
    statusValue: status || "ALL",
    levelValue: level || "ALL",
    languageValue: language || "ALL",
  });

  console.log("🎯 [CourseFilters] Props:", {
    availableSkillsLength: availableSkills.length,
    availableTagsLength: availableTags.length,
  });

  // Local state for filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    skillIdsParam ? skillIdsParam.split(",").filter(Boolean) : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    tagIdsParam ? tagIdsParam.split(",").filter(Boolean) : []
  );
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync local state with URL params
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
    
    // Reset to page 1 when filters change
    params.set("page", "1");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    console.log("🎯 [handleStatusChange] value:", value);
    updateUrlParams({ status: value === "ALL" ? null : value });
  };

  const handleLevelChange = (value: string) => {
    console.log("🎯 [handleLevelChange] value:", value);
    updateUrlParams({ level: value === "ALL" ? null : value });
  };

  const handleLanguageChange = (value: string) => {
    console.log("🎯 [handleLanguageChange] value:", value);
    updateUrlParams({ language: value === "ALL" ? null : value });
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter((id) => id !== skillId)
      : [...selectedSkills, skillId];
    
    setSelectedSkills(newSkills);
    updateUrlParams({ skillIds: newSkills.join(",") || null });
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newTags);
    updateUrlParams({ tagIds: newTags.join(",") || null });
  };

  const handleApplyPriceFilter = () => {
    updateUrlParams({
      minPrice: localMinPrice || null,
      maxPrice: localMaxPrice || null,
    });
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
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {console.log("🎨 [CourseFilters] Rendering with:", {
        status: status || "ALL",
        level: level || "ALL", 
        language: language || "ALL"
      })}
      
      {/* Status Filter */}
      <Select 
        value={status || "ALL"} 
        onValueChange={handleStatusChange}
        key={`status-${status || "ALL"}`}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("AllStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("AllStatus")}</SelectItem>
          <SelectItem value="DRAFT">{t("Status.DRAFT")}</SelectItem>
          <SelectItem value="PUBLISHED">{t("Status.PUBLISHED")}</SelectItem>
          <SelectItem value="ARCHIVED">{t("Status.ARCHIVED")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Level Filter */}
      <Select 
        value={level || "ALL"} 
        onValueChange={handleLevelChange}
        key={`level-${level || "ALL"}`}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Levels</SelectItem>
          <SelectItem value="BEGINNER">{t("Level.BEGINNER")}</SelectItem>
          <SelectItem value="INTERMEDIATE">{t("Level.INTERMEDIATE")}</SelectItem>
          <SelectItem value="ADVANCED">{t("Level.ADVANCED")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Language Filter */}
      <Select 
        value={language || "ALL"} 
        onValueChange={handleLanguageChange}
        key={`language-${language || "ALL"}`}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Languages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Languages</SelectItem>
          <SelectItem value="VI">Tiếng Việt</SelectItem>
          <SelectItem value="EN">English</SelectItem>
          <SelectItem value="JA">日本語</SelectItem>
        </SelectContent>
      </Select>

      {/* Skills Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={availableSkills.length === 0}>
            <Filter className="h-4 w-4" />
            Skills
            {selectedSkills.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedSkills.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        {availableSkills.length > 0 && (
          <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
            <div className="space-y-2">
              <h4 className="font-medium mb-3">Select Skills</h4>
              {availableSkills.map((skill) => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skill.id}`}
                    checked={selectedSkills.includes(skill.id)}
                    onCheckedChange={() => handleSkillToggle(skill.id)}
                  />
                  <label
                    htmlFor={`skill-${skill.id}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    {skill.thumbnail && (
                      <img
                        src={skill.thumbnail}
                        alt={skill.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <span className="text-sm">{skill.name}</span>
                    {skill.category && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {skill.category}
                      </Badge>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Tags Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={availableTags.length === 0}>
            <Filter className="h-4 w-4" />
            Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTags.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        {availableTags.length > 0 && (
          <PopoverContent className="w-64 max-h-96 overflow-y-auto" align="start">
            <div className="space-y-2">
              <h4 className="font-medium mb-3">Select Tags</h4>
              {availableTags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <label
                    htmlFor={`tag-${tag.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {tag.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Price Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Price
            {(minPrice || maxPrice) && (
              <Badge variant="secondary" className="ml-1">
                1
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <h4 className="font-medium">Price Range (USD)</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="999999"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
              <Button onClick={handleApplyPriceFilter} className="w-full">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAllFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear All ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
