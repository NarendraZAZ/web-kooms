import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "KOOMS",
  description: "Kerang OISHII Order Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <Script
          src={
            process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
            "https://app.sandbox.midtrans.com/snap/snap.js"
          }
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}