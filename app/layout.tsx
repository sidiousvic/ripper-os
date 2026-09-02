import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ripper OS — Training Data Analysis",
  description: "My training journey, analyzed into progress, consistency, muscle balance, highlights, and next opportunities.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
