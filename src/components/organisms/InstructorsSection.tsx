"use client";

import { useState } from "react";
import Image from "next/image";

import { AppSurface, PageHeader } from "@/components/common";
import { normalizePersistedMediaUrl } from "@/lib/file-media";

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

interface Instructor {
  id: string;
  username: string;
  avatar?: string;
  email: string;
}

interface InstructorsSectionProps {
  title: string;
  subtitle: string;
  instructors: Instructor[];
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

export function InstructorsSection({ title, subtitle, instructors }: InstructorsSectionProps) {
  const displayInstructors = instructors.slice(0, 4);

  if (displayInstructors.length === 0) return null;

  return (
    <section className="bg-app-subtle py-16">
      <div className="container mx-auto px-4">
        <PageHeader
          eyebrow="Instructors"
          title={title}
          description={subtitle}
          className="mb-10"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayInstructors.map((instructor) => (
            <AppSurface
              key={instructor.id}
              padding="none"
              interactive
              className="group overflow-hidden"
            >
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
          ))}
        </div>
      </div>
    </section>
  );
}
