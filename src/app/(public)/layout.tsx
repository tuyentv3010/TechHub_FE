"use client";
import { NewHeader } from "@/components/organisms/NewHeader";

export default function Layout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <NewHeader />
      <main className="flex-1">{children}</main>
      {modal}
    </div>
  );
}
