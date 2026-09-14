import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AshleyAI Playlist Studio",
  description:
    "A modern Apple Music playlist dashboard with weekly refreshes, immersive visuals, and dark/light themes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
