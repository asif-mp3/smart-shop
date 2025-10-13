import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Recommendation System",
  description:
    "A recommendation system that leverages AI to provide personalized suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` antialiased`}>{children}</body>
    </html>
  );
}
