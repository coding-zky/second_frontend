import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI WorkSpace",
  description: "AI-powered workspace application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
