import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "MeNabung - AI DeFi Advisor",
  description:
    "Grow your IDRX automatically with AI-powered DeFi strategies on Base",
  keywords: ["DeFi", "AI", "IDRX", "Base", "Savings", "Crypto", "Mini-App"],
  openGraph: {
    title: "MeNabung - AI DeFi Advisor",
    description: "Grow your IDRX automatically with AI-powered DeFi strategies",
    type: "website",
    images: ["/hero-1200x630.png"],
  },
  other: {
    "fc:frame": "vNext",
    "base:app_id": "696b4987f22fe462e74c1146",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh bg-cream">
        <Providers>
          <main className="max-w-md mx-auto min-h-dvh pb-20">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
