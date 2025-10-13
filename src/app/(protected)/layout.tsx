"use client";

import { Navbar } from "@/components/layout";
import { FullScreenLoader } from "@/components/loaders";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  // Show loading while checking session
  if (isPending) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
