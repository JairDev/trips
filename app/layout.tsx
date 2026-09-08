import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { FeedbackProvider } from "@/components/Feedback";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cupos — Logística de Senderismo",
  description:
    "Gestión colaborativa de inscritos, pagos y cupos de autobús para salidas de senderismo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fdfcfc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
