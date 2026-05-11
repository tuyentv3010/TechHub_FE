import Image from "next/image";

import { AppSurface, PageHeader } from "@/components/common";

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
            <AppSurface key={instructor.id} padding="none" className="overflow-hidden">
              <div className="relative h-72 bg-muted">
                <Image
                  src={instructor.avatar || "/instructors/Square.png"}
                  alt={instructor.username}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="line-clamp-1 text-base font-semibold text-foreground">
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
