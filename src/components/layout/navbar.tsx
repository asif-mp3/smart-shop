"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import { LogOut, User, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [_hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setHasCompletedOnboarding(data?.onboardingCompleted || false);
        })
        .catch((err) => {
          console.error("Error checking profile:", err);
        });
    }
  }, [session]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully", {
            description: "See you next time!",
          });
          window.location.href = "/";
        },
        onError: () => {
          toast.error("Sign out failed", {
            description: "Please try again.",
          });
        },
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-white/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/logo.png"
            alt="ShopSmart Logo"
            width={32}
            height={32}
            className="h-8 w-8 bg-white"
          />
          <div className="text-xl font-bold">ShopSmart</div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Button
                variant="link"
                onClick={() => router.push("/recommended")}
              >
                <Sparkles className="h-4 w-4" />
                Recommended
              </Button>
              <Button variant="link" onClick={() => router.push("/products")}>
                <ShoppingBag className="h-4 w-4" />
                All Products
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {session?.user.name
                          ? getInitials(session.user.name)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session?.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="link"
                onClick={() => router.push("/recommended")}
              >
                <Sparkles className="h-4 w-4" />
                Recommended
              </Button>
              <Button variant="link" onClick={() => router.push("/products")}>
                <ShoppingBag className="h-4 w-4" />
                All Products
              </Button>
              <Button variant="outline" onClick={() => router.push("/signin")}>
                Sign In
              </Button>
              <Button onClick={() => router.push("/signup")}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
