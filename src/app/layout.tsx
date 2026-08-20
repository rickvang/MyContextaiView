import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Builder",
  description: "Flowise-like visual builder aligned with ContextAi routing and workflow traces",
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
