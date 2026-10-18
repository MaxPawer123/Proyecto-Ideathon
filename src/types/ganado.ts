

/** Grados de calidad veterinaria */
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'Rechazado';

/** Estado de un lote de ganado */
export type LotStatus =
  | 'pending_verification'  // Creado, esperando veterinario
  | 'verified'              // Verificado, listo para subasta
  | 'auction_open'          // Subasta activa
  | 'auction_closed'        // Subasta cerrada, pendiente liquidación
  | 'settled'               // Liquidado (pago completado)
  | 'rejected';             // Rechazado por veterinario

/** Lote de ganado registrado en el contrato */
export interface CattleLot {
  lot_id: string;
  owner: string;                // Dirección Stellar del ganadero
  breed: string;                // Raza (ej: "Angus", "Hereford")
  head_count: number;           // Cantidad de cabezas
  weight_kg: number;            // Peso total en kg
  location: string;             // Ubicación geográfica
  base_price_usdc: number;      // Precio base en USDC (x10^7 stroops)
  status: LotStatus;
  created_at: number;           // Timestamp de creación
  verification?: VetVerification;
}

/** Resultado de verificación veterinaria */
export interface VetVerification {
  veterinarian: string;         // Dirección Stellar del veterinario
  pest_control_passed: boolean; // Control de plagas aprobado
  quality_grade: QualityGrade;  // Calificación de calidad
  verified_at: number;          // Timestamp de verificación
  notes?: string;               // Notas adicionales
}

/** Puja en una subasta */
export interface Bid {
  bid_id: string;
  lot_id: string;
  bidder: string;               // Dirección Stellar del pujador
  amount_usdc: number;          // Monto de la puja en USDC
  placed_at: number;            // Timestamp
}

/** Resultado de liquidación de subasta */
export interface AuctionSettlement {
  lot_id: string;
  winner: string;               // Dirección del ganador
  final_price_usdc: number;     // Precio final
  commission_usdc: number;      // Comisión 0.25%
  seller_receives_usdc: number; // Lo que recibe el vendedor
  settled_at: number;
  tx_hash: string;              // Hash de la transacción Stellar
}

/** Parámetros para crear un lote */
export interface CreateLotParams {
  breed: string;
  head_count: number;
  weight_kg: number;
  location: string;
  base_price_usdc: number;
}

/** Parámetros para verificación veterinaria */
export interface VerifyLotParams {
  lot_id: string;
  pest_control_passed: boolean;
  quality_grade: QualityGrade;
  notes?: string;
}

/** Parámetros para pujar */
export interface PlaceBidParams {
  lot_id: string;
  amount_usdc: number;
}

/** Respuesta genérica del servicio */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  tx_hash?: string;
}
