import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
// Si el "name" del package.json de ganado-client es otro, cambiar este import.
import { Client, networks } from "ganado-client";
import { Lote, TxResult, explorerTx } from "./types";
import { CONFIG } from "./config";

const RPC_URL = "https://soroban-testnet.stellar.org";

// Stellar usa 7 decimales
const toStroops = (n: number) => BigInt(Math.round(n * 10_000_000));
const fromStroops = (n: bigint) => Number(n) / 10_000_000;

const getClient = (publicKey?: string) =>
  new Client({
    contractId: CONFIG.contractId,
    networkPassphrase: networks.testnet.networkPassphrase,
    rpcUrl: RPC_URL,
    publicKey,
    signTransaction: (xdr: string, opts?: any) =>
      signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase ?? networks.testnet.networkPassphrase,
        address: opts?.address ?? publicKey,
      }),
  });

const toResult = (sent: any): TxResult => {
  const hash: string = sent?.sendTransactionResponse?.hash ?? "";
  return { hash, explorerUrl: explorerTx(hash) };
};

export const connectWallet = async (): Promise<string> => {
  const c = await isConnected();
  if (!c.isConnected) throw new Error("Instala la extensión Freighter y recarga la página");
  const access = await requestAccess();
  if (access.error) throw new Error(String(access.error));
  return access.address;
};

export const crearLote = async (seller: string, vet: string, cabezas: number, precioBase: number) => {
  const tx = await getClient(seller).create_lot({
    seller, vet, head_count: cabezas, base_price: toStroops(precioBase),
  });
  return toResult(await tx.signAndSend());
};

export const verificarLote = async (vet: string, id: number, libre: boolean, score: number, notas: string) => {
  const tx = await getClient(vet).verify_lot({
    lot_id: BigInt(id), pest_free: libre, vet_score: score, vet_notes: notas,
  });
  return toResult(await tx.signAndSend());
};

export const pujar = async (comprador: string, id: number, monto: number) => {
  const tx = await getClient(comprador).place_bid({
    lot_id: BigInt(id), bidder: comprador, bid_amount: toStroops(monto),
  });
  return toResult(await tx.signAndSend());
};

export const liquidar = async (comprador: string, id: number) => {
  const tx = await getClient(comprador).settle_auction({ lot_id: BigInt(id) });
  return toResult(await tx.signAndSend());
};

export const getLote = async (id: number): Promise<Lote> => {
  const tx = await getClient().get_lot({ lot_id: BigInt(id) }); // solo lectura, no firma
  const l: any = tx.result;
  return {
    id: Number(l.id), seller: l.seller, vet: l.vet, headCount: l.head_count,
    basePrice: fromStroops(l.base_price), highestBid: fromStroops(l.highest_bid),
    highestBidder: l.highest_bidder, pestFree: l.pest_free, vetScore: l.vet_score,
    vetNotes: l.vet_notes, isVerified: l.is_verified, isSettled: l.is_settled,
  };
};

// El contrato no tiene "listar": se itera desde 1 hasta que falle
export const listarLotes = async (max = 10): Promise<Lote[]> => {
  const out: Lote[] = [];
  for (let i = 1; i <= max; i++) {
    try { out.push(await getLote(i)); } catch { break; }
  }
  return out;
};
