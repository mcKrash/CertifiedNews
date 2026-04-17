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
  title: "Certified News | Global Verified News Gateway",
  description: "Every piece of news published here is certified, sourced, and traceable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} antialiased min-h-screen flex flex-col`}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
