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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: '(function(){try{var t=localStorage.getItem("releasetrace-theme");var isDark=t&&t!=="light"&&["dark","warm-brown","cyber-teal","sunset-rose"].indexOf(t)!==-1;if(t&&["light","dark","warm-brown","cyber-teal","sunset-rose"].indexOf(t)!==-1){document.documentElement.setAttribute("data-theme",t);}else{document.documentElement.setAttribute("data-theme","light");}if(isDark){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();' }} />
      </head>
      <body
        className={`${sansFont.variable} ${monoFont.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
