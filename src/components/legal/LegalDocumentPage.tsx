import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocumentPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalDocumentPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: LegalDocumentPageProps) {
  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/login"
            className="mb-8 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Quay lại đăng nhập
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            Cập nhật lần cuối: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={section.title} className="border-b border-border pb-8 last:border-0">
              <h2 className="text-xl font-semibold text-foreground">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
