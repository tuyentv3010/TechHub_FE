"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AppSurface, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useGetPublicInstructors } from "@/queries/useAccount";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";
const PAGE_SIZE = 12;

interface Instructor {
  id: string;
  username: string;
  avatar?: string;
  email: string;
}

function InstructorAvatar({ instructor }: { instructor: Instructor }) {
  const initialSrc = normalizePersistedMediaUrl(instructor.avatar) || DEFAULT_AVATAR;
  const [src, setSrc] = useState(initialSrc);

  return (
    <Image
      src={src}
      alt={instructor.username}
      fill
      className="th-hover-zoom object-cover"
      onError={() => setSrc(DEFAULT_AVATAR)}
    />
  );
}

export default function InstructorsListPage() {
  const tHome = useTranslations("HomePage");
  const t = (key: string) => tHome(`instructors.${key}`);
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useGetPublicInstructors(page, PAGE_SIZE);
  const instructors: Instructor[] = data?.payload?.data || [];
  // Heuristic: if a full page is returned there may be more.
  const hasNextPage = instructors.length === PAGE_SIZE;

  return (
    <section className="bg-app-subtle py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          eyebrow="Instructors"
          title={t("title")}
          description={t("subtitle")}
          className="mb-10"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="h-72 animate-pulse bg-muted" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : instructors.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("empty") || "Chưa có giảng viên nào."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {instructors.map((instructor) => (
                <Link
                  key={instructor.id}
                  href={`/instructor/${instructor.id}`}
                  className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AppSurface padding="none" interactive className="group overflow-hidden">
                    <div className="relative h-72 overflow-hidden bg-muted">
                      <InstructorAvatar instructor={instructor} />
                    </div>
                    <div className="p-5">
                      <h3 className="th-hover-title line-clamp-1 text-base font-semibold text-foreground">
                        {instructor.username}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {instructor.email}
                      </p>
                    </div>
                  </AppSurface>
                </Link>
              ))}
            </div>

            {(page > 0 || hasNextPage) && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page === 0 || isFetching}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  {tCommon("previous") || "Trang trước"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {tCommon("page") || "Trang"} {page + 1}
                </span>
                <Button
                  variant="outline"
                  disabled={!hasNextPage || isFetching}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {tCommon("next") || "Trang sau"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
