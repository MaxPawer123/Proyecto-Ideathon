import * as StellarSdk from "@stellar/stellar-sdk";
import {
  isConnected,
  requestAccess,
  signTransaction,
  getAddress,
  getNetworkDetails,
} from "@stellar/freighter-api";
import { STELLAR_CONFIG } from "@/config/stellar";

// ============================================================================
// CONFIGURACIÓN DE RED Y CONSTANTES
// ============================================================================

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  STELLAR_CONFIG?.SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  STELLAR_CONFIG?.CONTRACT_ID ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU45ZCBD3";

export const NETWORK_PASSPHRASE =
  STELLAR_CONFIG?.NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

// Servidor RPC de Soroban (Stellar SDK v17)
const server = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

// Escala de decimales: 1 USDC = 10,000,000 stroops (7 decimales)
export const STROOP_FACTOR = 10_000_000n;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface TxResult {
  txHash: string;
  explorerUrl: string;
  result?: unknown;
}

export interface CattleLot {
  id: number;
  seller: string;
  vet: string;
  head_count: number;
  base_price: number;       // En USDC normal (convertido de stroops)
  highest_bid: number;      // En USDC normal
  highest_bidder: string;
  pest_free: boolean;
  vet_score: number;
  vet_notes: string;
  is_verified: boolean;
  is_settled: boolean;
}

// ============================================================================
// CONVERSORES DE DECIMALES (STROOPS)
// ============================================================================

/**
 * Convierte un monto numérico a 7 decimales (stroops de Stellar) en formato BigInt
 */
export function toStroops(amount: number): bigint {
  if (isNaN(amount) || amount < 0) {
    throw new Error(`Monto inválido para conversión a stroops: ${amount}`);
  }
  return BigInt(Math.round(amount * 10_000_000));
}

/**
 * Convierte un valor en stroops (BigInt o number) a su valor real en USDC
 */
export function fromStroops(stroops: bigint | number | string): number {
  return Number(stroops) / 10_000_000;
}

/**
 * Enlace directo al explorador de transacciones de Stellar Testnet
 */
export function getExplorerUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

// ============================================================================
// HELPER PARA CONSTRUIR, SIMULAR, FIRMAR Y ENVIAR TRANSACCIONES
// ============================================================================

async function invokeContractTx(
  callerPublicKey: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<TxResult> {
  // 1. Cargar cuenta del firmante
  const account = await server.getAccount(callerPublicKey);

  // 2. Preparar la llamada al contrato
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const operation = contract.call(functionName, ...args);

  // 3. Construir transacción base
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // 4. Simular la transacción para calcular recursos y footprint
  const simulation = await server.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Fallo en la simulación de Soroban: ${simulation.error}`);
  }

  // 5. Ensamblar la transacción con los datos de simulación
  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simulation).build();

  // 6. Solicitar firma a Freighter
  const signResponse = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: callerPublicKey,
  });

  let signedXdr: string;
  if (typeof signResponse === "object" && signResponse !== null) {
    if ("error" in signResponse && signResponse.error) {
      throw new Error(`Firma rechazada por el usuario en Freighter: ${signResponse.error}`);
    }
    signedXdr = (signResponse as { signedTxXdr: string }).signedTxXdr;
  } else {
    signedXdr = signResponse as string;
  }

  if (!signedXdr) {
    throw new Error("No se recibió la transacción firmada desde Freighter.");
  }

  // 7. Enviar la transacción firmada a la red
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  ) as StellarSdk.Transaction;

  const sendResponse = await server.sendTransaction(signedTx);
  if (sendResponse.status === "ERROR") {
    throw new Error(`Error al enviar la transacción: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  // 8. Esperar la confirmación en el ledger (polling)
  const txHash = sendResponse.hash;
  let txResult = await server.getTransaction(txHash);

  while (txResult.status === StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    txResult = await server.getTransaction(txHash);
  }

  if (txResult.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(`La transacción falló en el contrato. Hash: ${txHash}`);
  }

  let parsedReturnValue: unknown = null;
  if (txResult.returnValue) {
    try {
      parsedReturnValue = StellarSdk.scValToNative(txResult.returnValue);
    } catch {
      parsedReturnValue = txResult.returnValue;
    }
  }

  return {
    txHash,
    explorerUrl: getExplorerUrl(txHash),
    result: parsedReturnValue,
  };
}

// ============================================================================
// 1. CONECTAR WALLET
// ============================================================================

/**
 * Solicita acceso a la extensión Freighter y devuelve la clave pública (G...) activa.
 */
export async function conectarWallet(): Promise<string> {
  try {
    const connectedResult = await isConnected();
    const isInstalled =
      typeof connectedResult === "boolean"
        ? connectedResult
        : (connectedResult as { isConnected: boolean })?.isConnected;

    if (!isInstalled) {
      throw new Error(
        "Freighter no está instalado o está deshabilitado. Instálalo desde https://freighter.app"
      );
    }

    const access = await requestAccess();
    if (typeof access === "object" && access !== null && "error" in access && access.error) {
      throw new Error(`Acceso denegado: ${access.error}`);
    }

    const addrResult = await getAddress();
    if (addrResult.error) {
      throw new Error(`Error obteniendo dirección: ${addrResult.error}`);
    }

    try {
      const net = await getNetworkDetails();
      if (net.networkPassphrase && net.networkPassphrase !== NETWORK_PASSPHRASE) {
        console.warn("⚠️ Asegúrate de cambiar la red de Freighter a Testnet.");
      }
    } catch {
      // Ignorar si getNetworkDetails no está disponible
    }

    return addrResult.address;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al conectar con Freighter";
    console.error("[conectarWallet]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// 2. CREAR LOTE DE GANADO
// ============================================================================

/**
 * Llama a 'create_lot' en el Smart Contract.
 * Escala precioBaseUsdc a 7 decimales (stroops).
 *
 * @param sellerAddr Dirección pública del vendedor/ganadero
 * @param vetAddr Dirección pública del veterinario asignado
 * @param cabezas Número de cabezas de ganado
 * @param precioBaseUsdc Precio base en USDC (ej: 100 -> 1,000,000,000 stroops)
 */
export async function crearLoteGanado(
  sellerAddr: string,
  vetAddr: string,
  cabezas: number,
  precioBaseUsdc: number
): Promise<TxResult> {
  try {
    if (!sellerAddr || !vetAddr) {
      throw new Error("Se requiere la dirección del vendedor y del veterinario.");
    }
    if (cabezas <= 0) {
      throw new Error("El número de cabezas debe ser mayor a 0.");
    }

    const basePriceStroops = toStroops(precioBaseUsdc);

    // Parámetros tipados como ScVal para Soroban:
    // create_lot(seller: Address, vet: Address, head_count: u32, base_price: i128)
    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(sellerAddr, { type: "address" }),
      StellarSdk.nativeToScVal(vetAddr, { type: "address" }),
      StellarSdk.nativeToScVal(cabezas, { type: "u32" }),
      StellarSdk.nativeToScVal(basePriceStroops, { type: "i128" }),
    ];

    return await invokeContractTx(sellerAddr, "create_lot", args);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al crear lote de ganado";
    console.error("[crearLoteGanado]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// 3. VERIFICAR VETERINARIO
// ============================================================================

/**
 * Llama a 'verify_lot' en el Smart Contract firmada por el veterinario.
 *
 * @param vetAddr Dirección pública del veterinario
 * @param lotId ID numérico del lote
 * @param pestFree Booleano: certificado libre de plagas/garrapatas
 * @param score Calificación veterinaria (ej: 1 a 5)
 * @param notas Notas o referencia del certificado SENASAG
 */
export async function verificarVeterinario(
  vetAddr: string,
  lotId: number | bigint,
  pestFree: boolean,
  score: number,
  notas: string
): Promise<TxResult> {
  try {
    if (!vetAddr) {
      throw new Error("Se requiere la dirección del veterinario.");
    }

    // verify_lot(lot_id: u64, pest_free: bool, vet_score: u32, vet_notes: String)
    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(BigInt(lotId), { type: "u64" }),
      StellarSdk.nativeToScVal(pestFree, { type: "bool" }),
      StellarSdk.nativeToScVal(score, { type: "u32" }),
      StellarSdk.nativeToScVal(notas || "SENASAG_OK", { type: "string" }),
    ];

    return await invokeContractTx(vetAddr, "verify_lot", args);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al certificar lote";
    console.error("[verificarVeterinario]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// 4. REALIZAR PUJA
// ============================================================================

/**
 * Llama a 'place_bid' en el Smart Contract.
 * Escala montoUsdc a 7 decimales (stroops).
 *
 * @param compradorAddr Dirección pública del pujador
 * @param lotId ID numérico del lote
 * @param montoUsdc Monto de la puja en USDC
 */
export async function realizarPuja(
  compradorAddr: string,
  lotId: number | bigint,
  montoUsdc: number
): Promise<TxResult> {
  try {
    if (!compradorAddr) {
      throw new Error("Se requiere la dirección del comprador.");
    }

    const bidAmountStroops = toStroops(montoUsdc);

    // place_bid(lot_id: u64, bidder: Address, bid_amount: i128)
    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(BigInt(lotId), { type: "u64" }),
      StellarSdk.nativeToScVal(compradorAddr, { type: "address" }),
      StellarSdk.nativeToScVal(bidAmountStroops, { type: "i128" }),
    ];

    return await invokeContractTx(compradorAddr, "place_bid", args);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al realizar puja";
    console.error("[realizarPuja]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// 5. LIQUIDAR SUBASTA
// ============================================================================

/**
 * Llama a 'settle_auction' en el Smart Contract.
 * Transfiere el pago en USDC al vendedor y descuenta la comisión del protocolo.
 *
 * @param compradorAddr Dirección pública del comprador ganador
 * @param lotId ID numérico del lote a liquidar
 */
export async function liquidarSubasta(
  compradorAddr: string,
  lotId: number | bigint
): Promise<TxResult> {
  try {
    if (!compradorAddr) {
      throw new Error("Se requiere la dirección de quien ejecuta la liquidación.");
    }

    // settle_auction(lot_id: u64)
    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(BigInt(lotId), { type: "u64" }),
    ];

    return await invokeContractTx(compradorAddr, "settle_auction", args);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al liquidar subasta";
    console.error("[liquidarSubasta]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// 6. LECTURA: OBTENER LOTE (READ-ONLY)
// ============================================================================

/**
 * Consulta el estado de un lote mediante simulación (sin requerir firma ni gas).
 */
export async function obtenerLote(lotId: number | bigint): Promise<CattleLot> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const operation = contract.call(
      "get_lot",
      StellarSdk.nativeToScVal(BigInt(lotId), { type: "u64" })
    );

    // Simulación anónima usando la dirección del propio contrato como fuente temporal
    const fakeAccount = new StellarSdk.Account(CONTRACT_ID, "0");
    const tx = new StellarSdk.TransactionBuilder(fakeAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(sim) || !sim.result?.retval) {
      throw new Error(`Lote #${lotId} no encontrado en el contrato`);
    }

    const raw: any = StellarSdk.scValToNative(sim.result.retval);

    return {
      id: Number(raw.id ?? lotId),
      seller: String(raw.seller ?? ""),
      vet: String(raw.vet ?? ""),
      head_count: Number(raw.head_count ?? 0),
      base_price: fromStroops(raw.base_price ?? 0),
      highest_bid: fromStroops(raw.highest_bid ?? 0),
      highest_bidder: String(raw.highest_bidder ?? ""),
      pest_free: Boolean(raw.pest_free),
      vet_score: Number(raw.vet_score ?? 0),
      vet_notes: String(raw.vet_notes ?? ""),
      is_verified: Boolean(raw.is_verified),
      is_settled: Boolean(raw.is_settled),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : `Error obteniendo lote #${lotId}`;
    console.error("[obtenerLote]", msg);
    throw new Error(msg);
  }
}

// ============================================================================
// UTILIDADES ADICIONALES Y ALIAS DE COMPATIBILIDAD
// ============================================================================

export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
    return res.ok;
  } catch {
    return false;
  }
}

// Alias para compatibilidad con código existente
export const connectWallet = async () => ({
  success: true,
  data: { publicKey: await conectarWallet() },
  error: undefined as string | undefined,
});
export const createLot = async (params: { breed?: string; head_count: number; weight_kg?: number; location?: string; base_price_usdc: number }) => {
  const pubKey = await conectarWallet();
  const res = await crearLoteGanado(pubKey, pubKey, params.head_count, params.base_price_usdc);
  return { success: true, tx_hash: res.txHash, data: null, error: undefined as string | undefined };
};
export const verifyLot = async (params: { lot_id: string | number; pest_control_passed: boolean; quality_grade?: string; notes?: string }) => {
  const pubKey = await conectarWallet();
  const res = await verificarVeterinario(pubKey, typeof params.lot_id === "string" ? parseInt(params.lot_id.replace(/\D/g, "") || "1", 10) : params.lot_id, params.pest_control_passed, 5, params.notes ?? "");
  return { success: true, tx_hash: res.txHash, error: undefined as string | undefined };
};
export const placeBid = async (params: { lot_id: string | number; amount_usdc: number }) => {
  const pubKey = await conectarWallet();
  const res = await realizarPuja(pubKey, typeof params.lot_id === "string" ? parseInt(params.lot_id.replace(/\D/g, "") || "1", 10) : params.lot_id, params.amount_usdc);
  return { success: true, tx_hash: res.txHash, error: undefined as string | undefined };
};
export const settleAuction = async (lotId: string | number) => {
  const pubKey = await conectarWallet();
  const res = await liquidarSubasta(pubKey, typeof lotId === "string" ? parseInt(lotId.replace(/\D/g, "") || "1", 10) : lotId);
  return { success: true, tx_hash: res.txHash, data: null, error: undefined as string | undefined };
};
