import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CogCommit - Document Your AI-Assisted Development",
  description:
    "Track, visualize, and share your cognitive commits. A cognitive commit captures the reasoning, exploration, and decisions that led to the code.",
  keywords: ["AI", "coding", "cognitive commits", "Claude", "development", "documentation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
