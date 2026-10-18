import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remates Rurales — Subasta Ganadera en Stellar/Soroban",
  description:
    "Mesa de Remate Ganadero con Liquidación Directa en Dólares Digitales (USDC). Comisión 0.25%.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
