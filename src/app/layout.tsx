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
  title: "ReleaseTrace — Release Operations & Incident Recall",
  description:
    "Deterministic pre-flight risk classification, Prisma migration analysis, and Hindsight incident recall.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface text-on-surface min-h-screen selection:bg-primary-container/20 selection:text-primary`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
