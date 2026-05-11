import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Git Painter",
  description: "Paint your GitHub contribution graph with custom commit history.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/favicon/apple-touch-icon.png" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Git Painter",
    description: "Paint your GitHub contribution graph with custom commit history.",
    type: "website",
    images: [
      { url: "/static/1.png", alt: "Git Painter – Date Range step" },
      { url: "/static/2.png", alt: "Git Painter – Intensity & Style step" },
      { url: "/static/3.png", alt: "Git Painter – Review & Generate step" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Painter",
    description: "Paint your GitHub contribution graph with custom commit history.",
    images: ["/static/1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
