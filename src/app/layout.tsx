import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shree Himalaya Basic School - Exam Management System",
  description: "Exam Management System for Shree Himalaya Basic School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
