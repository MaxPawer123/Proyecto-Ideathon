// =====================================================
// GanadoChain — Mock Service
// Simula las respuestas del contrato para desarrollo de UI
// =====================================================
//
// Usa este servicio mientras el contrato aún no está desplegado.
// Comparte la misma interfaz que sorobanService.ts para swap fácil.
//
// Uso:
//   // En tu componente, cambia el import:
//   import { connectWallet, createLot, ... } from '@/services/mockService';
//   // En vez de:
//   import { connectWallet, createLot, ... } from '@/services/sorobanService';

import type {
  CattleLot,
  CreateLotParams,
  VerifyLotParams,
  PlaceBidParams,
  AuctionSettlement,
  ServiceResponse,
  Bid,
  VetVerification,
} from '@/types/ganado';
import { STELLAR_CONFIG } from '@/config/stellar';

// ─── Datos simulados en memoria ──────────────────────

let mockLots: CattleLot[] = [
  {
    lot_id: 'LOT-001',
    owner: 'GDEMO1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    breed: 'Angus',
    head_count: 120,
    weight_kg: 54000,
    location: 'Córdoba, Argentina',
    base_price_usdc: 180000,
    status: 'verified',
    created_at: Date.now() - 86400000,
    verification: {
      veterinarian: 'GVET01XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      pest_control_passed: true,
      quality_grade: 'A',
      verified_at: Date.now() - 43200000,
      notes: 'Lote en excelentes condiciones. Sin signos de enfermedad.',
    },
  },
  {
    lot_id: 'LOT-002',
    owner: 'GDEMO2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    breed: 'Hereford',
    head_count: 80,
    weight_kg: 36000,
    location: 'Entre Ríos, Argentina',
    base_price_usdc: 120000,
    status: 'pending_verification',
    created_at: Date.now() - 3600000,
  },
  {
    lot_id: 'LOT-003',
    owner: 'GDEMO1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    breed: 'Braford',
    head_count: 200,
    weight_kg: 90000,
    location: 'Santa Fe, Argentina',
    base_price_usdc: 300000,
    status: 'auction_open',
    created_at: Date.now() - 172800000,
    verification: {
      veterinarian: 'GVET01XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      pest_control_passed: true,
      quality_grade: 'B',
      verified_at: Date.now() - 86400000,
    },
  },
];

let mockBids: Bid[] = [
  {
    bid_id: 'BID-001',
    lot_id: 'LOT-003',
    bidder: 'GBUY01XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    amount_usdc: 310000,
    placed_at: Date.now() - 7200000,
  },
  {
    bid_id: 'BID-002',
    lot_id: 'LOT-003',
    bidder: 'GBUY02XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    amount_usdc: 325000,
    placed_at: Date.now() - 3600000,
  },
];

let mockCounter = 100;
const FAKE_WALLET = 'GUSER0REALWALLETADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// ─── Utilidad: delay simulando latencia de red ──────

function delay(ms: number = 800): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeTxHash(): string {
  const chars = 'abcdef0123456789';
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── FUNCIONES PÚBLICAS (misma interfaz que sorobanService) ──

/**
 * 1️⃣ CONECTAR WALLET (mock)
 */
export async function connectWallet(): Promise<ServiceResponse<{ publicKey: string }>> {
  await delay(500);
  console.log('🔗 [MOCK] Wallet conectada:', FAKE_WALLET);
  return {
    success: true,
    data: { publicKey: FAKE_WALLET },
  };
}

/**
 * 2️⃣ CREAR LOTE (mock)
 */
export async function createLot(
  params: CreateLotParams,
): Promise<ServiceResponse<CattleLot>> {
  await delay(1200);

  const newLot: CattleLot = {
    lot_id: `LOT-${String(++mockCounter).padStart(3, '0')}`,
    owner: FAKE_WALLET,
    breed: params.breed,
    head_count: params.head_count,
    weight_kg: params.weight_kg,
    location: params.location,
    base_price_usdc: params.base_price_usdc,
    status: 'pending_verification',
    created_at: Date.now(),
  };

  mockLots.push(newLot);
  console.log('🐄 [MOCK] Lote creado:', newLot);

  return {
    success: true,
    data: newLot,
    tx_hash: fakeTxHash(),
  };
}

/**
 * 3️⃣ VERIFICAR LOTE (mock)
 */
export async function verifyLot(
  params: VerifyLotParams,
): Promise<ServiceResponse<{ verified: boolean }>> {
  await delay(1000);

  const lot = mockLots.find((l) => l.lot_id === params.lot_id);
  if (!lot) {
    return { success: false, error: `Lote ${params.lot_id} no encontrado` };
  }

  const verification: VetVerification = {
    veterinarian: FAKE_WALLET,
    pest_control_passed: params.pest_control_passed,
    quality_grade: params.quality_grade,
    verified_at: Date.now(),
    notes: params.notes,
  };

  lot.verification = verification;
  lot.status = params.pest_control_passed && params.quality_grade !== 'Rechazado'
    ? 'verified'
    : 'rejected';

  console.log('🩺 [MOCK] Verificación:', { lot_id: params.lot_id, result: lot.status });

  return {
    success: true,
    data: { verified: lot.status === 'verified' },
    tx_hash: fakeTxHash(),
  };
}

/**
 * 4️⃣ REALIZAR PUJA (mock)
 */
export async function placeBid(
  params: PlaceBidParams,
): Promise<ServiceResponse<Bid>> {
  await delay(900);

  const lot = mockLots.find((l) => l.lot_id === params.lot_id);
  if (!lot) {
    return { success: false, error: `Lote ${params.lot_id} no encontrado` };
  }
  if (lot.status !== 'auction_open' && lot.status !== 'verified') {
    return { success: false, error: `Lote ${params.lot_id} no está en subasta` };
  }

  // Validar que la puja sea mayor que la anterior
  const currentBids = mockBids.filter((b) => b.lot_id === params.lot_id);
  const highestBid = currentBids.length > 0
    ? Math.max(...currentBids.map((b) => b.amount_usdc))
    : lot.base_price_usdc;

  if (params.amount_usdc <= highestBid) {
    return {
      success: false,
      error: `La puja (${params.amount_usdc} USDC) debe ser mayor que la actual (${highestBid} USDC)`,
    };
  }

  const newBid: Bid = {
    bid_id: `BID-${String(++mockCounter).padStart(3, '0')}`,
    lot_id: params.lot_id,
    bidder: FAKE_WALLET,
    amount_usdc: params.amount_usdc,
    placed_at: Date.now(),
  };

  mockBids.push(newBid);
  lot.status = 'auction_open';

  console.log('💰 [MOCK] Puja registrada:', newBid);

  return {
    success: true,
    data: newBid,
    tx_hash: fakeTxHash(),
  };
}

/**
 * 5️⃣ LIQUIDAR SUBASTA (mock)
 * Calcula el 0.25% de comisión sobre el precio final.
 */
export async function settleAuction(
  lotId: string,
): Promise<ServiceResponse<AuctionSettlement>> {
  await delay(1500);

  const lot = mockLots.find((l) => l.lot_id === lotId);
  if (!lot) {
    return { success: false, error: `Lote ${lotId} no encontrado` };
  }

  const lotBids = mockBids.filter((b) => b.lot_id === lotId);
  if (lotBids.length === 0) {
    return { success: false, error: `No hay pujas para el lote ${lotId}` };
  }

  // Ganador = puja más alta
  const winningBid = lotBids.reduce((max, b) => (b.amount_usdc > max.amount_usdc ? b : max));

  const finalPrice = winningBid.amount_usdc;
  const commission = finalPrice * STELLAR_CONFIG.COMMISSION_RATE;
  const sellerReceives = finalPrice - commission;

  const settlement: AuctionSettlement = {
    lot_id: lotId,
    winner: winningBid.bidder,
    final_price_usdc: finalPrice,
    commission_usdc: commission,
    seller_receives_usdc: sellerReceives,
    settled_at: Date.now(),
    tx_hash: fakeTxHash(),
  };

  lot.status = 'settled';

  console.log('✅ [MOCK] Subasta liquidada:', {
    lote: lotId,
    ganador: winningBid.bidder,
    precio: `${finalPrice} USDC`,
    comision: `${commission} USDC (0.25%)`,
    vendedor_recibe: `${sellerReceives} USDC`,
  });

  return {
    success: true,
    data: settlement,
    tx_hash: settlement.tx_hash,
  };
}

// ─── EXTRAS: Consultas mock ──────────────────────────

/** Obtener todos los lotes */
export async function getAllLots(): Promise<ServiceResponse<CattleLot[]>> {
  await delay(300);
  return { success: true, data: [...mockLots] };
}

/** Obtener pujas de un lote */
export async function getLotBids(lotId: string): Promise<ServiceResponse<Bid[]>> {
  await delay(300);
  return {
    success: true,
    data: mockBids.filter((b) => b.lot_id === lotId),
  };
}

/** Obtener balance simulado */
export async function getAccountBalance(
  _publicKey: string,
): Promise<{ xlm: string; usdc: string }> {
  await delay(200);
  return { xlm: '9,500.00', usdc: '250,000.00' };
}
