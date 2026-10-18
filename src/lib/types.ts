// =====================================================
// GanadoChain — Tipos UI unificados
// Puente entre la UI de remate y los servicios backend
// =====================================================

import type { CattleLot, AuctionSettlement } from "@/types/ganado";

/** Tipo simplificado del lote para la UI del remate */
export type Lote = {
  id: number;
  lotId: string;             // LOT-001, etc.
  seller: string;
  vet: string;
  breed: string;
  headCount: number;
  weightKg: number;
  location: string;
  basePrice: number;         // USDC en unidades normales
  highestBid: number;
  highestBidder: string;
  pestFree: boolean;
  vetScore: number;
  vetNotes: string;
  isVerified: boolean;
  isSettled: boolean;
  qualityGrade: string;
};

export type TxResult = { hash: string; explorerUrl: string };

export const explorerTx = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

// Comisión 0.25% = 25 / 10000 (misma fórmula que el contrato)
export const calcularComision = (total: number) => {
  const fee = (total * 25) / 10000;
  return { fee, vendedor: total - fee };
};

export const corto = (a: string) => (a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "");

/** Convierte un CattleLot del backend al Lote simplificado de UI */
export function cattleLotToLote(lot: CattleLot, index: number): Lote {
  const gradeToScore: Record<string, number> = {
    'A': 5, 'B': 4, 'C': 3, 'D': 2, 'Rechazado': 1,
  };

  return {
    id: index + 1,
    lotId: lot.lot_id,
    seller: lot.owner,
    vet: lot.verification?.veterinarian ?? "",
    breed: lot.breed,
    headCount: lot.head_count,
    weightKg: lot.weight_kg,
    location: lot.location,
    basePrice: lot.base_price_usdc,
    highestBid: lot.base_price_usdc,  // Se actualizará con datos de pujas
    highestBidder: lot.owner,
    pestFree: lot.verification?.pest_control_passed ?? false,
    vetScore: gradeToScore[lot.verification?.quality_grade ?? ""] ?? 0,
    vetNotes: lot.verification?.notes ?? "Pendiente",
    isVerified: lot.status === 'verified' || lot.status === 'auction_open' || lot.status === 'settled',
    isSettled: lot.status === 'settled',
    qualityGrade: lot.verification?.quality_grade ?? "Sin calificar",
  };
}

export type { CattleLot, AuctionSettlement };
