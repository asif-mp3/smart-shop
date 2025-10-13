"use client";

import { FullScreenLoader } from "@/components/loaders";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/products");
    }
  }, [session, isPending, router]);

  // Show loading while checking session
  if (isPending) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
