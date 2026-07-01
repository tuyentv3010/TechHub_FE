"use client";

import { FolderGit2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toStringArray, type CvProject } from "@/types/instructor";

export function ProjectCard({ project }: { project: CvProject }) {
  const t = useTranslations("instructor");
  if (!project?.name) return null;
  const tags = toStringArray(project.tags);

  return (
    <Card className="p-5 transition-shadow hover:shadow-md hover:border-primary/35">
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 flex-none place-items-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <FolderGit2 className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display font-bold text-foreground">
            {project.name}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label={t("project.openAria", { name: project.name })}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </h3>
          {project.role && <p className="mt-0.5 text-sm text-muted-foreground">{project.role}</p>}
        </div>
      </div>

      {project.description && (
        <p className="mt-3.5 text-[0.95rem] leading-relaxed text-foreground/85">{project.description}</p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
