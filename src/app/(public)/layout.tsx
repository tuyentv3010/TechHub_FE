"use client";
import { DropdownProfile } from "@/components/organisms/DropdownProfile";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";
import { PublicShell } from "@/components/layout";
import Image from "next/image";
import { usePathname } from "next/navigation";

const AUTH_HEADER_PATHS = [
  "/login",
  "/login/oauth",
  "/logout",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/refresh-token",
  "/oauth2/redirect",
  "/terms",
  "/terms-of-service",
  "/privacy",
  "/privacy-policy",
  "/policy",
];

function isAuthHeaderPath(pathname: string | null) {
  return AUTH_HEADER_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );
}

export default function Layout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const pathname = usePathname();
  const useAuthHeader = isAuthHeaderPath(pathname);
  const showAiShortcut = !(pathname === "/ai-chat" || pathname?.startsWith("/ai-chat/"));

  return (
    <AiLearningPathProvider>
      <PublicShell
        floatingAction={
          showAiShortcut ? (
            <a
              href="/ai-chat"
              className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2"
            >
              <Image
                src="/ai/TechHub_Logo.png"
                alt="AI Chat Assistant"
                width={56}
                height={56}
                className="rounded-xl border border-border bg-card object-cover shadow-sm"
                priority={true}
              />
            </a>
          ) : null
        }
      >
        <DropdownProfile variant={useAuthHeader ? "auth" : "default"} />
        {children}
        {modal}
      </PublicShell>
    </AiLearningPathProvider>
  );
}
