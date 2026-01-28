import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Web Scraper - Extract Data from Any Website",
  description: "A powerful web scraping tool built with Next.js and FastAPI. Extract titles, meta tags, links, images, and more from any website.",
  keywords: "web scraper, data extraction, scraping tool, next.js, fastapi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
