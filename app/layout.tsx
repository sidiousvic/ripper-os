import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Journey — Strength & Consistency Dashboard",
  description: "A complete Gymverse and MacroFactor training dashboard: progress, consistency, muscle balance, and next opportunities.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
