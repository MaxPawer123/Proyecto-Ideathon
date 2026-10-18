// =====================================================
// GanadoChain — Servicio de integración Soroban
// Conecta Frontend ↔ Freighter ↔ Smart Contract
// =====================================================
//
// Dependencias:
//   npm install @stellar/stellar-sdk @stellar/freighter-api
//
// Uso:
//   import { connectWallet, createLot, verifyLot, placeBid, settleAuction } from '@/services/sorobanService';

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  requestAccess,
  signTransaction,
  isConnected,
  getAddress,
  getNetworkDetails,
} from '@stellar/freighter-api';

import { STELLAR_CONFIG } from '@/config/stellar';
import type {
  CattleLot,
  CreateLotParams,
  VerifyLotParams,
  PlaceBidParams,
  AuctionSettlement,
  ServiceResponse,
  Bid,
} from '@/types/ganado';

// ─── Soroban RPC client (SDK v17: rpc.Server) ───────
const server = new StellarSdk.rpc.Server(
  STELLAR_CONFIG.SOROBAN_RPC_URL,
);

// ─── Helpers internos ────────────────────────────────

/** Verifica que Freighter esté instalado y conectado */
async function ensureFreighter(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error(
      'Freighter no está instalado o no está conectado. Instálalo desde freighter.app',
    );
  }

  const networkDetails = await getNetworkDetails();
  if (networkDetails.networkPassphrase !== STELLAR_CONFIG.NETWORK_PASSPHRASE) {
    throw new Error(
      `Freighter está en otra red. Cámbialo a TESTNET en Settings → Network.`,
    );
  }

  const { address, error } = await getAddress();
  if (error) {
    throw new Error(`Error obteniendo dirección de Freighter: ${error}`);
  }
  return address;
}

/** Carga la cuenta del usuario desde Soroban RPC */
async function loadAccount(publicKey: string): Promise<StellarSdk.Account> {
  const account = await server.getAccount(publicKey);
  return account;
}

/** Construye, simula, firma y envía una transacción Soroban */
async function buildAndSubmitTx(
  publicKey: string,
  contractFn: string,
  args: StellarSdk.xdr.ScVal[],
): Promise<{ resultVal: StellarSdk.xdr.ScVal; txHash: string }> {
  // 1. Cargar cuenta
  const account = await loadAccount(publicKey);

  // 2. Crear la operación invokeContract
  const contract = new StellarSdk.Contract(STELLAR_CONFIG.CONTRACT_ID);
  const operation = contract.call(contractFn, ...args);

  // 3. Construir la transacción
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(STELLAR_CONFIG.TX_TIMEOUT_SEC)
    .build();

  // 4. Simular para obtener footprint y costos
  const simulated = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulación falló: ${simulated.error}`);
  }

  // 5. Preparar la transacción con el resultado de la simulación
  const preparedTx = StellarSdk.rpc.assembleTransaction(
    tx,
    simulated,
  ).build();

  // 6. Firmar con Freighter (v6 API: devuelve { signedTxXdr, signerAddress, error? })
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  });

  if (signResult.error) {
    throw new Error(`Error al firmar con Freighter: ${signResult.error}`);
  }

  // 7. Enviar la transacción firmada
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    STELLAR_CONFIG.NETWORK_PASSPHRASE,
  ) as StellarSdk.Transaction;

  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === 'ERROR') {
    throw new Error(`Error al enviar tx: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  // 8. Polling hasta confirmación
  const txHash = sendResponse.hash;
  let getResponse = await server.getTransaction(txHash);
  
  while (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResponse = await server.getTransaction(txHash);
  }

  if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(`Transacción falló: ${txHash}`);
  }

  // 9. Extraer el valor de retorno
  const resultVal = getResponse.returnValue!;
  return { resultVal, txHash };
}

// ─── FUNCIONES PÚBLICAS ──────────────────────────────

/**
 * 1️⃣ CONECTAR WALLET
 * Solicita acceso a Freighter y retorna la dirección pública.
 */
export async function connectWallet(): Promise<ServiceResponse<{ publicKey: string }>> {
  try {
    const publicKey = await ensureFreighter();
    await requestAccess();
    return {
      success: true,
      data: { publicKey },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido conectando wallet',
    };
  }
}

/**
 * 2️⃣ CREAR LOTE DE GANADO
 * Registra un nuevo lote en el smart contract.
 *
 * Ejemplo:
 *   await createLot({
 *     breed: 'Angus',
 *     head_count: 50,
 *     weight_kg: 25000,
 *     location: 'Córdoba, Argentina',
 *     base_price_usdc: 150000,  // 150,000 USDC
 *   });
 */
export async function createLot(
  params: CreateLotParams,
): Promise<ServiceResponse<CattleLot>> {
  try {
    const publicKey = await ensureFreighter();

    // Convertir parámetros a ScVal para Soroban
    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(publicKey, { type: 'address' }),            // owner
      StellarSdk.nativeToScVal(params.breed, { type: 'string' }),          // breed
      StellarSdk.nativeToScVal(params.head_count, { type: 'u32' }),        // head_count
      StellarSdk.nativeToScVal(params.weight_kg, { type: 'u32' }),         // weight_kg
      StellarSdk.nativeToScVal(params.location, { type: 'string' }),       // location
      StellarSdk.nativeToScVal(BigInt(params.base_price_usdc * 1e7), { type: 'i128' }), // base_price (7 decimals USDC)
    ];

    const { resultVal, txHash } = await buildAndSubmitTx(publicKey, 'create_lot', args);

    // Parsear resultado — el contrato retorna el struct del lote
    const lotData = StellarSdk.scValToNative(resultVal) as CattleLot;

    return {
      success: true,
      data: lotData,
      tx_hash: txHash,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando lote',
    };
  }
}

/**
 * 3️⃣ VERIFICACIÓN VETERINARIA
 * Un veterinario autorizado verifica el control de plagas y califica el lote.
 *
 * Ejemplo:
 *   await verifyLot({
 *     lot_id: 'LOT-001',
 *     pest_control_passed: true,
 *     quality_grade: 'A',
 *     notes: 'Lote en excelentes condiciones',
 *   });
 */
export async function verifyLot(
  params: VerifyLotParams,
): Promise<ServiceResponse<{ verified: boolean }>> {
  try {
    const publicKey = await ensureFreighter();

    const gradeMap: Record<string, number> = {
      'A': 0, 'B': 1, 'C': 2, 'D': 3, 'Rechazado': 4,
    };

    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(params.lot_id, { type: 'string' }),                 // lot_id
      StellarSdk.nativeToScVal(publicKey, { type: 'address' }),                     // veterinarian
      StellarSdk.nativeToScVal(params.pest_control_passed, { type: 'bool' }),       // pest_control_passed
      StellarSdk.nativeToScVal(gradeMap[params.quality_grade], { type: 'u32' }),    // quality_grade (enum index)
    ];

    const { resultVal, txHash } = await buildAndSubmitTx(publicKey, 'verify_lot', args);
    const verified = StellarSdk.scValToNative(resultVal) as boolean;

    return {
      success: true,
      data: { verified },
      tx_hash: txHash,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error verificando lote',
    };
  }
}

/**
 * 4️⃣ REALIZAR PUJA
 * Coloca una puja en una subasta activa.
 *
 * Ejemplo:
 *   await placeBid({
 *     lot_id: 'LOT-001',
 *     amount_usdc: 160000,  // 160,000 USDC
 *   });
 */
export async function placeBid(
  params: PlaceBidParams,
): Promise<ServiceResponse<Bid>> {
  try {
    const publicKey = await ensureFreighter();

    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(params.lot_id, { type: 'string' }),                       // lot_id
      StellarSdk.nativeToScVal(publicKey, { type: 'address' }),                           // bidder
      StellarSdk.nativeToScVal(BigInt(params.amount_usdc * 1e7), { type: 'i128' }),      // amount (7 decimals)
    ];

    const { resultVal, txHash } = await buildAndSubmitTx(publicKey, 'place_bid', args);
    const bidData = StellarSdk.scValToNative(resultVal) as Bid;

    return {
      success: true,
      data: bidData,
      tx_hash: txHash,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al pujar',
    };
  }
}

/**
 * 5️⃣ LIQUIDAR SUBASTA
 * Cierra la subasta, transfiere USDC al vendedor, cobra 0.25% de comisión.
 *
 * Ejemplo:
 *   await settleAuction('LOT-001');
 */
export async function settleAuction(
  lotId: string,
): Promise<ServiceResponse<AuctionSettlement>> {
  try {
    const publicKey = await ensureFreighter();

    const args: StellarSdk.xdr.ScVal[] = [
      StellarSdk.nativeToScVal(lotId, { type: 'string' }), // lot_id
    ];

    const { resultVal, txHash } = await buildAndSubmitTx(publicKey, 'settle_auction', args);
    const settlement = StellarSdk.scValToNative(resultVal) as AuctionSettlement;

    // Agregar el hash de la tx al resultado
    settlement.tx_hash = txHash;

    return {
      success: true,
      data: settlement,
      tx_hash: txHash,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error liquidando subasta',
    };
  }
}

// ─── UTILIDADES EXTRAS ──────────────────────────────

/** Obtener fondos de prueba de Friendbot (solo Testnet) */
export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${STELLAR_CONFIG.FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

/** Consultar el balance de la cuenta */
export async function getAccountBalance(
  publicKey: string,
): Promise<{ xlm: string; usdc: string }> {
  try {
    const horizonServer = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
    const account = await horizonServer.loadAccount(publicKey);

    let xlm = '0';
    let usdc = '0';

    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        xlm = balance.balance;
      }
      // Ajustar el issuer según el USDC que usen en Testnet
      if (
        'asset_code' in balance &&
        balance.asset_code === 'USDC'
      ) {
        usdc = balance.balance;
      }
    }

    return { xlm, usdc };
  } catch {
    return { xlm: '0', usdc: '0' };
  }
}
