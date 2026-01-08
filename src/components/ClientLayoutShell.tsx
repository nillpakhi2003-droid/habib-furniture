"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { Footer } from "./Footer";

export function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <MobileSidebar />
      {children}
      <Footer />
    </>
  );
}
