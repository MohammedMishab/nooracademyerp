import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noor Academy ERP",
  description: "Student ERP portal for Noor Academy",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
