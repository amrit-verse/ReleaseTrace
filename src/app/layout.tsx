import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

// Stitch design system typography: Inter for UI, JetBrains Mono for technical labels
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
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
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
