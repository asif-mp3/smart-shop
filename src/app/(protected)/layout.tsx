"use client";

import { Navbar } from "@/components/layout";
import { FullScreenLoader } from "@/components/loaders";
import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // Check if user has completed onboarding (except for onboarding page itself)
    if (session && !profileChecked && pathname !== "/onboarding") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          console.log("Profile check data:", data);
          setProfileChecked(true);

          // If no profile or onboarding not completed, redirect to onboarding
          if (!data.profile || !data.profile.onboardingCompleted) {
            console.log("Onboarding incomplete, redirecting...");
            router.push("/onboarding");
          } else {
            console.log("Onboarding completed, allowing access");
          }
        })
        .catch((err) => {
          console.error("Error checking profile:", err);
          setProfileChecked(true);
        });
    } else if (session && pathname === "/onboarding") {
      setProfileChecked(true);
    }
  }, [session, pathname, profileChecked, router]);

  // Show loading while checking session and profile
  if (isPending || (session && !profileChecked)) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
