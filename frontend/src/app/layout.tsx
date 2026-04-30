import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { ToastContainer } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StackPulse - Real-time Stacks Blockchain Alerts",
  description: "Monitor whale transfers, token launches, NFT mints, and more with Hiro Chainhooks",
  keywords: ["Stacks", "blockchain", "alerts", "monitoring", "STX", "NFT", "DeFi"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  other: {
    "talentapp:project_verification": "284a312c9318227a714ef3051b305073e5184c2841cd432a64f5966b69df2a8f77279ba3b4dcf29a8d97db05d8ae39251535897c2d28ec9fcf608b96f4483235",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="talentapp:project_verification" content="844833b40c40f26a619a180579e5ca6a351183e87aa983caf3db1fe5da27dff0c258b12d3db5e5cff0086b04e6d4de049ea3eb132dd4b957b6d6bbf12fb2a15d" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <WalletProvider>
          {children}
          <ToastContainer />
        </WalletProvider>
      </body>
    </html>
  );
}
