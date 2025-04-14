import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "bedda chat",
  description: "AI-powered chat",
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
