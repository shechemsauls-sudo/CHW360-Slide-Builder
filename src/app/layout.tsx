import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHW360 Slide Builder",
  description: "Interactive web application for building slides — built for Shechem",
  authors: [{ name: "Matthew Miceli" }],
  openGraph: {
    title: "CHW360 Slide Builder",
    description: "Interactive web application for building slides — built for Shechem",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CHW360 Slide Builder",
    description: "Interactive web application for building slides — built for Shechem",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
