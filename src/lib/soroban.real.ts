// =====================================================
// GanadoChain — Servicio real Soroban para UI de remate
// Adapta sorobanService.ts al contrato simplificado de la UI
// =====================================================
//
// Activar cuando el contrato esté desplegado:
//   En soroban.ts, cambiar a: export * from "./soroban.real";
//

import {
  connectWallet as backendConnect,
  createLot,
  verifyLot,
  placeBid,
  settleAuction,
  fundWithFriendbot,
} from "@/services/sorobanService";

import { Lote, TxResult, explorerTx, cattleLotToLote } from "./types";
import type { CattleLot } from "@/types/ganado";
import { STELLAR_CONFIG } from "@/config/stellar";
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.rpc.Server(STELLAR_CONFIG.SOROBAN_RPC_URL);

const toTxResult = (hash?: string): TxResult => {
  const h = hash ?? "";
  return { hash: h, explorerUrl: explorerTx(h) };
};

/** Conecta wallet via Freighter */
export const connectWallet = async (): Promise<string> => {
  const result = await backendConnect();
  if (result.success && result.data) {
    return result.data.publicKey;
  }
  throw new Error(result.error ?? "Error conectando wallet");
};

/** Crea un lote nuevo en el contrato */
export const crearLote = async (
  seller: string,
  vet: string,
  cabezas: number,
  precioBase: number,
  raza: string = "Mestizo",
  pesoKg: number = cabezas * 450,
  ubicacion: string = "Bolivia"
): Promise<TxResult> => {
  const result = await createLot({
    breed: raza,
    head_count: cabezas,
    weight_kg: pesoKg,
    location: ubicacion,
    base_price_usdc: precioBase,
  });
  if (!result.success) throw new Error(result.error ?? "Error creando lote");
  return toTxResult(result.tx_hash);
};

/** Verificar/certificar un lote en el contrato */
export const verificarLote = async (
  _vet: string,
  id: number,
  libre: boolean,
  score: number,
  notas: string
): Promise<TxResult> => {
  const gradeMap: Record<number, "A" | "B" | "C" | "D" | "Rechazado"> = {
    5: "A", 4: "B", 3: "C", 2: "D", 1: "Rechazado",
  };

  // Construir el lot_id del contrato
  const lotId = `LOT-${String(id).padStart(3, "0")}`;

  const result = await verifyLot({
    lot_id: lotId,
    pest_control_passed: libre,
    quality_grade: gradeMap[score] ?? "C",
    notes: notas,
  });

  if (!result.success) throw new Error(result.error ?? "Error verificando lote");
  return toTxResult(result.tx_hash);
};

/** Realizar una puja en el contrato */
export const pujar = async (
  comprador: string,
  id: number,
  monto: number
): Promise<TxResult> => {
  const lotId = `LOT-${String(id).padStart(3, "0")}`;

  const result = await placeBid({
    lot_id: lotId,
    amount_usdc: monto,
  });

  if (!result.success) throw new Error(result.error ?? "Error al pujar");
  return toTxResult(result.tx_hash);
};

/** Liquidar/pagar la subasta en el contrato */
export const liquidar = async (
  _comprador: string,
  id: number
): Promise<TxResult> => {
  const lotId = `LOT-${String(id).padStart(3, "0")}`;

  const result = await settleAuction(lotId);
  if (!result.success) throw new Error(result.error ?? "Error liquidando subasta");
  return toTxResult(result.tx_hash);
};

/** Obtener un lote por índice — lectura directa del contrato */
export const getLote = async (id: number): Promise<Lote> => {
  // TODO: Implementar lectura directa del contrato cuando esté disponible
  throw new Error("getLote real no implementado aún");
};

/** Listar lotes — itera hasta que falle */
export const listarLotes = async (max = 10): Promise<Lote[]> => {
  // TODO: Implementar lectura iterativa del contrato
  return [];
};

export { fundWithFriendbot };
