import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
