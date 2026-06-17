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

export const metadata = {
  title: "TemanTeduh AI Premium - Sahabat Curhat & Pendamping Emosional 100% Anonim",
  description: "TemanTeduh AI adalah pendamping emosional cerdas dengan kecerdasan emosional (EI) dan memori jangka panjang untuk membantu meredakan cemas, sedih, dan stres secara aman dan 100% anonim.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
