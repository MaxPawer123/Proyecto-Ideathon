import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GanadoChain — Remate de Ganado Verificado en Stellar",
  description:
    "Plataforma descentralizada de subastas de ganado con verificación veterinaria on-chain en Stellar/Soroban. Comisión 0.25%.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
