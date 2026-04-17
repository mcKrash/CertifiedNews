import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "../components/layout-client";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({ 
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather"
});

export const metadata: Metadata = {
  title: "WCNA | World Certified News Alliance",
  description: "The global gateway for verified, traceable, and sourced news. Every article is certified by the World Certified News Alliance.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={`${inter.variable} ${merriweather.variable} antialiased min-h-screen flex flex-col`}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
