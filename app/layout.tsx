import type { Metadata } from "next";
import "./globals.css";

const siteDescription = "Ripper OS organizes your training data into progress, consistency, muscle balance, highlights and opportunities. It's like Spotify Wrapped, for training.";

export const metadata: Metadata = {
  title: "Ripper OS — Training Data Analysis",
  description: siteDescription,
  openGraph: {
    title: "Ripper OS — Training Data Analysis",
    description: siteDescription,
  },
  twitter: {
    title: "Ripper OS — Training Data Analysis",
    description: siteDescription,
  },
  icons: {
    icon: "/brand/ripperos-logo-favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
