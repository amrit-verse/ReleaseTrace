import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

// Self-contained typography: local fonts avoid network failures during build
const sansFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const monoFont = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ReleaseTrace — Release Risk Intelligence & Hindsight Memory",
  description:
    "Enterprise engineering interface for pre-flight deployment risk classification, environment drift comparison, and Hindsight post-mortem memory recall.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sansFont.variable} ${monoFont.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
