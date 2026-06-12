import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iRacing Schedule Analyzer",
  description: "Current-season analysis and track lookup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
