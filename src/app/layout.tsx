import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "HAE — How to Expand Acronym",
  description:
    "Turn random letters into English phrases. AI-graded solo mode, party-voting multiplayer mode.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-[#08080b] text-zinc-100">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="bg-grid absolute inset-0" />
          <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-violet-600/25 blur-[120px]" />
          <div className="absolute top-1/3 -right-20 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
          <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-[120px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
