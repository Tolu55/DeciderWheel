import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070714",
};

export const metadata: Metadata = {
  title: "Decider Wheel — Anonymous Random Decider",
  description:
    "Enter a dilemma with 2 to 12 choices and share the mystery wheel with a friend. Slices stay concealed until they spin!",
  openGraph: {
    title: "Decider Wheel — Mystery Random Decider",
    description:
      "Spin the anonymous mystery wheel to make a decision without giving away the choices in advance!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decider Wheel — Mystery Random Decider",
    description:
      "Spin the anonymous mystery wheel to make a decision without giving away the choices in advance!",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
