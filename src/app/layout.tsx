import type { Metadata } from "next";
import { Dela_Gothic_One, Geist, Geist_Mono, Hachi_Maru_Pop } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hachiMaruPop = Hachi_Maru_Pop({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hachi-maru",
  display: "swap",
});

const delaGothic = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dela-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "cabaguide 「この子でよかった」と思える夜へ",
  description: "広告費によるランキングではなく、Instagram・TikTokの総フォロワー数に基づいたランキングで有名・人気キャストを見つけよう！",
  verification: {
    google: "wtUbhnp9MNYrynatbdDqn_6x0zGjrnPC5v4M7rIDt1k",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClass = `${geistSans.variable} ${geistMono.variable} ${hachiMaruPop.variable} ${delaGothic.variable} antialiased`;

  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-X3BW5HP16Q"
          strategy="afterInteractive"
        />
        <Script id="ga4-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X3BW5HP16Q');
          `}
        </Script>
      </head>
      <body className={bodyClass}>
        {isMaintenanceMode ? (
          <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.25),_transparent_55%)] px-6 text-center">
            <p className="text-2xl font-semibold tracking-wide text-foreground md:text-3xl">
              現在メンテナンス中です。
            </p>
          </main>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
