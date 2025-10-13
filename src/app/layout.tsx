import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ShopSmart - Personalized Product Recommendations",
  description:
    "ShopSmart is an intelligent e-commerce platform that provides personalized product recommendations based on your preferences, lifestyle, and shopping habits. Discover products tailored just for you across Electronics, Clothing, Sports, Home & Garden, Accessories, and Personal Care categories.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
