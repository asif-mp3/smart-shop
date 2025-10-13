"use client";

import { FullScreenLoader } from "@/components/loaders";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    if (!isPending && session && !checkingProfile) {
      setCheckingProfile(true);

      // Check if user has completed onboarding
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.onboardingCompleted) {
            router.push("/recommended");
          } else {
            router.push("/onboarding");
          }
        })
        .catch((err) => {
          console.error("Error checking profile:", err);
          router.push("/onboarding");
        });
    }
  }, [session, isPending, router, checkingProfile]);

  // Show loading while checking session and profile
  if (isPending || (session && !checkingProfile)) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
