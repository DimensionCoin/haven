import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCAR",
  description: "Make more confident choices",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-zinc-100`}
          >
            {/* Global background gradients and decorative elements */}
            <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm -z-10"></div>
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
              <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl"></div>
            </div>

            <Toaster position="top-right" reverseOrder={false} />

            {/* Main area */}
            <div className="flex flex-1 w-full">
              {/* Main Content Area with left margin on md+ screens */}
              <main className="flex-1 w-full overflow-auto ">{children}</main>
            </div>
          </body>
        </html>
    </ClerkProvider>
  );
}
