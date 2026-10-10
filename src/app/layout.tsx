import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Beach Avenue! Admin", template: "%s · Beach Avenue! Admin" },
  description: "Administration console for the Roblox game Beach Avenue!",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1a",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Render every route per request so the CSP nonce from proxy.ts applies.
  await connection();
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
