"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
} from "@/components/ui";
import { DynamicFormFields } from "@/components/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      console.log(result);

      if (result.error) {
        // Handle specific error messages
        const errorMessage = result.error.message || "Failed to sign up";
        if (
          errorMessage.includes("existing email") ||
          errorMessage.includes("already exists")
        ) {
          toast.error("Email already registered", {
            description:
              "This email is already in use. Please sign in or use a different email.",
          });
        } else {
          toast.error("Sign up failed", {
            description: errorMessage,
          });
        }
        return;
      }

      toast.success("Account created successfully!", {
        description: "Let's personalize your experience...",
      });
      router.push("/onboarding");
    } catch (err) {
      toast.error("Please try again later.");
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    {
      name: "name" as const,
      label: "Name",
      type: "text" as const,
      placeholder: "John Doe",
    },
    {
      name: "email" as const,
      label: "Email",
      type: "email" as const,
      placeholder: "john@example.com",
    },
    {
      name: "password" as const,
      label: "Password",
      type: "password" as const,
      placeholder: "••••••••",
    },
    {
      name: "confirmPassword" as const,
      label: "Confirm Password",
      type: "password" as const,
      placeholder: "••••••••",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <DynamicFormFields control={form.control} fields={fields} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <a href="/signin" className="text-primary hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
