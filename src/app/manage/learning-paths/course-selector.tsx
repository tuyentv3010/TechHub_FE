"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { Search, BookOpen } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetCourseListQuery } from "@/queries/useCourse";

interface CourseSelectorProps {
  onClose: () => void;
  onSelect: (courseIds: string[]) => void;
  existingCourseIds: string[];
}

export default function CourseSelector({
  onClose,
  onSelect,
  existingCourseIds,
}: CourseSelectorProps) {
  const t = useTranslations("CourseSelector");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const { data: coursesData, isLoading } = useGetCourseListQuery({
    page: 0,
    size: 50,
    keyword: searchKeyword || undefined,
  });

  const availableCourses =
    coursesData?.data.filter(
      (course) => !existingCourseIds.includes(course.id)
    ) || [];

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleConfirm = () => {
    if (selectedCourseIds.length > 0) {
      onSelect(selectedCourseIds);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("Title")}</DialogTitle>
          <DialogDescription>{t("Description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("SearchPlaceholder")}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {selectedCourseIds.length} {t("Selected")}
            </Badge>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">
                {t("Loading")}
              </p>
            ) : availableCourses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {t("NoCourses")}
              </p>
            ) : (
              availableCourses.map((course) => (
                <Card
                  key={course.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedCourseIds.includes(course.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggleCourse(course.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedCourseIds.includes(course.id)}
                      onCheckedChange={() => handleToggleCourse(course.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {course.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {course.level}
                            </Badge>
                            {course.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {course.duration}h
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCourseIds.length === 0}
          >
            {t("AddSelected")} ({selectedCourseIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
