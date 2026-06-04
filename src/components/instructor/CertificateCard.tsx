"use client";

import { Award, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CvCertification } from "@/types/instructor";
import { tFallback } from "@/lib/i18n-fallback";

export function CertificateCard({ cert }: { cert: CvCertification }) {
  const t = useTranslations("instructor");
  const tr = (key: string, fallback: string, values?: Record<string, string | number | Date>) =>
    tFallback(t, "instructor", key, fallback, values);
  if (!cert?.name) return null;

  return (
    <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary/40">
      <span
        className="grid size-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950"
        aria-hidden="true"
      >
        <Award className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-display font-bold leading-snug text-foreground">{cert.name}</h3>
        {(cert.issuer || cert.date) && (
          <p className="mt-0.5 text-sm text-foreground/80">
            {cert.issuer}
            {cert.date ? <span className="text-muted-foreground"> · {cert.date}</span> : null}
          </p>
        )}
      </div>

      {cert.credentialUrl && (
        <Button asChild variant="outline" size="sm" className="flex-none gap-1.5 text-primary">
          <a
            href={cert.credentialUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={tr("cert.verifyAria", `Xác minh chứng chỉ ${cert.name}`, { name: cert.name })}
          >
            <ShieldCheck className="size-4" />
            {tr("cert.verify", "Xác minh")}
          </a>
        </Button>
      )}
    </Card>
  );
}
