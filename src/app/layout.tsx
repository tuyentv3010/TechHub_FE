import type { Metadata } from "next";
import './globals.css';

export const metadata: Metadata = {
  title: "TechHub - Learning Platform",
  description: "Enterprise-grade learning management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
