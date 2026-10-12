import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppHeader } from "@/components/AppHeader";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://job-copilot-helper.vercel.app";
const description =
  "Your AI assistant for job applications: a match score, a tailored cover letter, and a CV built for each role.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Job Copilot",
  description,
  openGraph: {
    title: "Job Copilot",
    description,
    url: siteUrl,
    siteName: "Job Copilot",
    type: "website",
    images: [{ url: "/banner-v2.png", width: 1200, height: 630, alt: "Job Copilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Copilot",
    description,
    images: ["/banner-v2.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <AppHeader />
          {children}
        </body>
        <Toaster />
      </html>
    </ClerkProvider>
  );
}
