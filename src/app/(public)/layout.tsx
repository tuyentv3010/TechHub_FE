"use client";
import Footer from "@/components/footer";
import { DropdownProfile } from "@/components/organisms/DropdownProfile";

export default function Layout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <DropdownProfile />
      <main className="flex-1">{children}</main>
      {modal}
    </div>
  );
}
