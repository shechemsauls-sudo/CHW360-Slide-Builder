import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Baskerville } from "next/font/google";
import { Toaster } from "sonner";
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

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CHW360 — Empowering Community Health Workers Across Texas",
  description:
    "CHW360 provides training, resources, and support to help Community Health Workers learn, grow, and make a difference in their communities.",
  authors: [{ name: "Shechem Community Health" }],
  openGraph: {
    title: "CHW360 — Empowering Community Health Workers Across Texas",
    description:
      "Training, resources, and support for Community Health Workers across Texas.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CHW360 — Empowering Community Health Workers",
    description:
      "Training, resources, and support for Community Health Workers across Texas.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${libreBaskerville.variable} antialiased`}
      >
        <TRPCReactProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
