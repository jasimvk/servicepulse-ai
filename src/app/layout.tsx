import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServicePulse AI | Gemini XPRIZE",
  description:
    "AI operations desk for local service businesses, built for the Gemini XPRIZE."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="aurora-bg min-h-screen text-[#FAFAFA]">{children}</body>
    </html>
  );
}
