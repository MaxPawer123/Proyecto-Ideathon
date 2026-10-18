// =====================================================
// GanadoChain — Config UI unificada
// Lee de .env.local y de la config del backend
// =====================================================

import { STELLAR_CONFIG } from "@/config/stellar";

export type Rol = "ganadero" | "veterinario" | "comprador";

export const CONFIG = {
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? STELLAR_CONFIG.CONTRACT_ID,
  network: STELLAR_CONFIG.NETWORK,
  networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  rpcUrl: STELLAR_CONFIG.SOROBAN_RPC_URL,
  horizonUrl: STELLAR_CONFIG.HORIZON_URL,
  friendbotUrl: STELLAR_CONFIG.FRIENDBOT_URL,
  commissionRate: STELLAR_CONFIG.COMMISSION_RATE,
  addr: {
    ganadero: process.env.NEXT_PUBLIC_GANADERO_ADDR ?? "",
    veterinario: process.env.NEXT_PUBLIC_VETERINARIO_ADDR ?? "",
    comprador: process.env.NEXT_PUBLIC_COMPRADOR_ADDR ?? "",
  } as Record<Rol, string>,
};
