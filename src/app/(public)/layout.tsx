"use client";
import Footer from "@/components/footer";
import { DropdownProfile } from "@/components/organisms/DropdownProfile";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";
import Image from "next/image";

export default function Layout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <AiLearningPathProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DropdownProfile />
        <main className="flex-1">{children}</main>
        {modal}
        
        {/* AI Chat Button */}
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
      </div>
    </AiLearningPathProvider>
  );
}
