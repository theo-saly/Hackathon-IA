import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechCorp — Financial Assistant",
  description: "AI-powered financial assistant for TechCorp Industries",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
      </body>
    </html>
  );
}
