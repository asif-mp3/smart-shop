"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully", {
            description: "See you next time!",
          });
          window.location.href = "/signin";
        },
        onError: () => {
          toast.error("Sign out failed", {
            description: "Please try again.",
          });
        },
      },
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {session?.user.name}!</CardTitle>
            <CardDescription>
              You are successfully authenticated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Email:</span>{" "}
                {session?.user.email}
              </p>
              <p className="text-sm">
                <span className="font-semibold">User ID:</span>{" "}
                {session?.user.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
