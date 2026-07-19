import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Sentinel Mesh", template: "%s | Sentinel Mesh" },
  description: "Local-first software security intelligence and attack-path simulation platform.",
  applicationName: "Sentinel Mesh",
  keywords: ["DevSecOps", "software security", "attack graph", "SAST", "open source security"],
  openGraph: { title: "Sentinel Mesh", description: "See how your system can be breached before it happens.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
