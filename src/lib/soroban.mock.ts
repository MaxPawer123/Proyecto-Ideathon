// =====================================================
// GanadoChain — Servicio Mock para UI de remate
// Adapta mockService.ts al contrato simplificado de la UI
// =====================================================

import {
  connectWallet as backendConnect,
  createLot,
  verifyLot,
  placeBid,
  settleAuction,
  getAllLots,
  getLotBids,
} from "@/services/mockService";

import { Lote, TxResult, explorerTx, cattleLotToLote, FALLBACK_CONTRACT_URL } from "./types";
import type { CattleLot, AuctionSettlement } from "@/types/ganado";

// ─── Almacén de pujas más altas por lote (mock) ─────
const highestBids: Record<string, { amount: number; bidder: string }> = {};

const fakeTxResult = (_hash?: string): TxResult => {
  return {
    hash: "contract_verified",
    explorerUrl: FALLBACK_CONTRACT_URL,
  };
};

/** Conecta wallet via backend mock */
export const connectWallet = async (): Promise<string> => {
  const result = await backendConnect();
  if (result.success && result.data) {
    return result.data.publicKey;
  }
  throw new Error(result.error ?? "Error conectando wallet");
};

/** Crea un lote nuevo */
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
  return fakeTxResult(result.tx_hash);
};

/** Verificar/certificar un lote */
export const verificarLote = async (
  _vet: string,
  id: number,
  libre: boolean,
  score: number,
  notas: string
): Promise<TxResult> => {
  // Mapear score numérico 1-5 a grado de calidad
  const gradeMap: Record<number, "A" | "B" | "C" | "D" | "Rechazado"> = {
    5: "A", 4: "B", 3: "C", 2: "D", 1: "Rechazado",
  };

  const lots = await getAllLots();
  if (!lots.success || !lots.data) throw new Error("No se pudieron cargar los lotes");

  const lot = lots.data[id - 1];
  if (!lot) throw new Error("El lote no existe");

  const result = await verifyLot({
    lot_id: lot.lot_id,
    pest_control_passed: libre,
    quality_grade: gradeMap[score] ?? "C",
    notes: notas,
  });

  if (!result.success) throw new Error(result.error ?? "Error verificando lote");
  return fakeTxResult(result.tx_hash);
};

/** Realizar una puja */
export const pujar = async (
  comprador: string,
  id: number,
  monto: number
): Promise<TxResult> => {
  const lots = await getAllLots();
  if (!lots.success || !lots.data) throw new Error("No se pudieron cargar los lotes");

  const lot = lots.data[id - 1];
  if (!lot) throw new Error("El lote no existe");

  if (lot.status !== "verified" && lot.status !== "auction_open") {
    throw new Error("El lote debe estar verificado para pujar");
  }

  const result = await placeBid({
    lot_id: lot.lot_id,
    amount_usdc: monto,
  });

  if (!result.success) throw new Error(result.error ?? "Error al pujar");

  // Actualizar registro de puja más alta
  highestBids[lot.lot_id] = { amount: monto, bidder: comprador };

  return fakeTxResult(result.tx_hash);
};

/** Liquidar/pagar la subasta */
export const liquidar = async (
  _comprador: string,
  id: number
): Promise<TxResult> => {
  const lots = await getAllLots();
  if (!lots.success || !lots.data) throw new Error("No se pudieron cargar los lotes");

  const lot = lots.data[id - 1];
  if (!lot) throw new Error("El lote no existe");

  const result = await settleAuction(lot.lot_id);
  if (!result.success) throw new Error(result.error ?? "Error liquidando subasta");

  return fakeTxResult(result.tx_hash);
};

/** Obtener un lote por índice */
export const getLote = async (id: number): Promise<Lote> => {
  const lots = await getAllLots();
  if (!lots.success || !lots.data) throw new Error("No se pudieron cargar los lotes");

  const lot = lots.data[id - 1];
  if (!lot) throw new Error("El lote no existe");

  const lote = cattleLotToLote(lot, id - 1);

  // Cargar pujas del lote
  const bidsResult = await getLotBids(lot.lot_id);
  if (bidsResult.success && bidsResult.data && bidsResult.data.length > 0) {
    const highestBid = bidsResult.data.reduce((max, b) =>
      b.amount_usdc > max.amount_usdc ? b : max
    );
    lote.highestBid = highestBid.amount_usdc;
    lote.highestBidder = highestBid.bidder;
  }

  // También verificar nuestro cache local
  if (highestBids[lot.lot_id] && highestBids[lot.lot_id].amount > lote.highestBid) {
    lote.highestBid = highestBids[lot.lot_id].amount;
    lote.highestBidder = highestBids[lot.lot_id].bidder;
  }

  return lote;
};

/** Listar todos los lotes */
export const listarLotes = async (_max = 10): Promise<Lote[]> => {
  const lots = await getAllLots();
  if (!lots.success || !lots.data) return [];

  const lotes: Lote[] = [];
  for (let i = 0; i < Math.min(lots.data.length, _max); i++) {
    const lote = cattleLotToLote(lots.data[i], i);

    // Enriquecer con datos de pujas
    const bidsResult = await getLotBids(lots.data[i].lot_id);
    if (bidsResult.success && bidsResult.data && bidsResult.data.length > 0) {
      const highestBid = bidsResult.data.reduce((max, b) =>
        b.amount_usdc > max.amount_usdc ? b : max
      );
      lote.highestBid = highestBid.amount_usdc;
      lote.highestBidder = highestBid.bidder;
    }

    if (highestBids[lots.data[i].lot_id] && highestBids[lots.data[i].lot_id].amount > lote.highestBid) {
      lote.highestBid = highestBids[lots.data[i].lot_id].amount;
      lote.highestBidder = highestBids[lots.data[i].lot_id].bidder;
    }

    lotes.push(lote);
  }

  return lotes;
};
