

export type RoleView = 'BUYER' | 'COMPANY';

export type LotStatus = 'PENDING_VET' | 'ACTIVE_AUCTION' | 'SETTLED';

/**
 * Formateador numérico determinista para evitar discrepancias de hidratación (SSR vs Cliente)
 */
export function formatNumber(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}


export interface BidEntry {
  id: string;
  bidder: string;
  amountUsdc: number;
  timestamp: string;
}

export interface CattleLot {
  id: string;
  title: string;
  breed: string;
  headCount: number;
  avgWeightKg: number;
  location: string;
  imageUrl: string;
  sellerAddress: string;
  basePriceUsdc: number;
  currentBidUsdc: number;
  highestBidder: string | null;
  vetVerified: boolean;
  vetAddress?: string;
  pestFree: boolean;
  footAndMouthVaccine: boolean;
  vetScore: number;
  txHashVet?: string;
  status: LotStatus;
  txHashSettle?: string;
  bids: BidEntry[];
}

/** Datos del formulario para crear un nuevo lote (Vista Empresa Agropecuaria) */
export interface CreateLotFormData {
  title: string;
  breed: string;
  headCount: number;
  avgWeightKg: number;
  location: string;
  priceUsdc: number;
  imageUrl?: string;
}



export const INITIAL_LOTS: CattleLot[] = [
  {
    id: 'LOTE-041',
    title: '500 Novillos Nelore - Hacienda El Dorado',
    breed: 'Nelore Puro Registrado',
    headCount: 500,
    avgWeightKg: 435,
    location: 'Pailón, Santa Cruz - Bolivia',
    imageUrl: 'https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?auto=format&fit=crop&w=1000&q=80',
    sellerAddress: 'GD5DJQ...6R7E',
    basePriceUsdc: 100000,
    currentBidUsdc: 100000,
    highestBidder: 'Frigorífico del Oriente (GBUY...89X2)',
    vetVerified: true,
    vetAddress: 'Dr. M. Salvatierra (GVET...44L1)',
    pestFree: true,
    footAndMouthVaccine: true,
    vetScore: 5,
    txHashVet: '8f9d2a1b4c6e8f0a2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c',
    status: 'ACTIVE_AUCTION',
    bids: [
      { id: 'b1', bidder: 'Frigorífico del Oriente (GBUY...89X2)', amountUsdc: 100000, timestamp: '18:35 hrs' },
    ],
  },
  {
    id: 'LOTE-042',
    title: '200 Vaquillonas Aberdeen Angus',
    breed: 'Aberdeen Angus Negro',
    headCount: 200,
    avgWeightKg: 380,
    location: 'Trinidad, Beni - Bolivia',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1000&q=80',
    sellerAddress: 'GANADERO2...99K1',
    basePriceUsdc: 64000,
    currentBidUsdc: 65500,
    highestBidder: 'Estancia San Ignacio (GINV...11A9)',
    vetVerified: true,
    vetAddress: 'Dr. M. Salvatierra (GVET...44L1)',
    pestFree: true,
    footAndMouthVaccine: true,
    vetScore: 5,
    txHashVet: '3a1b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a1b',
    status: 'ACTIVE_AUCTION',
    bids: [
      { id: 'b2', bidder: 'Estancia San Ignacio (GINV...11A9)', amountUsdc: 65500, timestamp: '18:20 hrs' },
      { id: 'b3', bidder: 'Agropecuaria del Sur (GCOR...33P0)', amountUsdc: 64000, timestamp: '18:05 hrs' },
    ],
  },
  {
    id: 'LOTE-043',
    title: '120 Toros Reproductores Brahman',
    breed: 'Brahman Gris de Cabana',
    headCount: 120,
    avgWeightKg: 580,
    location: 'Camiri, Cordillera - Bolivia',
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1000&q=80',
    sellerAddress: 'GANADERO3...22M8',
    basePriceUsdc: 85000,
    currentBidUsdc: 85000,
    highestBidder: null,
    vetVerified: false,
    pestFree: false,
    footAndMouthVaccine: true,
    vetScore: 0,
    status: 'PENDING_VET',
    bids: [],
  },
];