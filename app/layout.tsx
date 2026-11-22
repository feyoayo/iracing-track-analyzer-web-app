import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getRequestLocale } from "@/lib/i18n/server";
import { Analytics } from '@vercel/analytics/next';

// Cookie-derived HTML language requires rendering this layout per request.
export const instant = false;

export const metadata: Metadata = {
  title: "iR Schedule Analyzer",
  description: "Current-season analysis and track lookup",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
