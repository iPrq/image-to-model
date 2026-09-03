import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Core3D — 2D Image to 3D Model Studio",
  description: "High-precision 3D mesh reconstruction from single reference images.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <head>
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
