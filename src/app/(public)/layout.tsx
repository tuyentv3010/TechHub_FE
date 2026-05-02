"use client";
import Footer from "@/components/footer";
import { DropdownProfile } from "@/components/organisms/DropdownProfile";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Layout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showAiShortcut = !(pathname === "/ai-chat" || pathname?.startsWith("/ai-chat/"));

  return (
    <AiLearningPathProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DropdownProfile />
        <main className="flex-1">{children}</main>
        {modal}

        {showAiShortcut ? (
          <a
            href="/ai-chat"
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2"
          >
            <Image
              src="/ai/TechHub_Logo.png"
              alt="AI Chat Assistant"
              width={60}
              height={60}
              className="rounded-full object-cover shadow-2xl"
              priority={true}
            />
          </a>
        ) : null}
      </div>
    </AiLearningPathProvider>
  );
}
