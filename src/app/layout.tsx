import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Bottega",
  description: "Órdenes de reparación de Bottega & Preserva",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
