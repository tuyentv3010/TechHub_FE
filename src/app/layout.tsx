import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
// import AppProvider from "@/components/app-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import Footer from "@/components/footer";
import { baseOpenGraph } from "@/shared-metadata";
import GoogleTag from "@/components/google-tag";
import { AppProvider } from "@/components/app-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AiLearningPathProvider } from "@/contexts/AiLearningPathContext";
import Image from "next/image";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("HomePage");
  return {
    title: {
      template: `%s | ${t("title")}`,
      default: t("defaultTitle"),
    },
    openGraph: {
      ...baseOpenGraph,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <NextTopLoader showSpinner={false} color="hsl(var(--foreground))" />
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <AiLearningPathProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
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
                {/* <Footer /> */}
                <Toaster />
              </ThemeProvider>
            </AiLearningPathProvider>
          </AppProvider>
        </NextIntlClientProvider>
        <GoogleTag />
      </body>
    </html>
  );
}
