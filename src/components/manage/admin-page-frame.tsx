import { cn } from "@/lib/utils";

type AdminPageFrameProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminPageFrame({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: AdminPageFrameProps) {
  return (
    <main className={cn("manage-page", className)}>
      <div className="manage-page-frame">
        <div className="manage-page-header">
          <div className="space-y-3">
            {eyebrow ? <p className="manage-page-eyebrow">{eyebrow}</p> : null}
            <div className="space-y-2">
              <h1 className="manage-page-title">{title}</h1>
              {description ? (
                <p className="manage-page-description">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        <div className={cn("space-y-6", contentClassName)}>{children}</div>
      </div>
    </main>
  );
}

type AdminSurfaceProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminSurface({ children, className }: AdminSurfaceProps) {
  return <section className={cn("manage-surface", className)}>{children}</section>;
}
