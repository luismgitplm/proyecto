import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import HydrationFix from "./components/HydrationFix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Terra Nova — Hotel & Suites",
  description: "Descubre el equilibrio entre confort y naturaleza. Reserva tu estancia en Terra Nova.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased no-transitions`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        <HydrationFix />
        <Header />
        {children}
      </body>
    </html>
  );
}
