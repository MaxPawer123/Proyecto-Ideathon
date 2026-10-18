import { Lote, TxResult, explorerTx } from "./types";

let lotes: Lote[] = [];
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
const fakeTx = (): TxResult => {
  const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash, explorerUrl: explorerTx(hash) };
};

export const connectWallet = async () =>
  "GMOCK" + "0".repeat(46) + "TEST";

export const crearLote = async (seller: string, vet: string, cabezas: number, precioBase: number) => {
  await wait();
  lotes.push({
    id: lotes.length + 1, seller, vet, headCount: cabezas, basePrice: precioBase,
    highestBid: precioBase, highestBidder: seller, pestFree: false, vetScore: 0,
    vetNotes: "Pendiente", isVerified: false, isSettled: false,
  });
  return fakeTx();
};

export const verificarLote = async (_vet: string, id: number, libre: boolean, score: number, notas: string) => {
  await wait();
  const l = lotes.find((x) => x.id === id);
  if (!l) throw new Error("El lote no existe");
  Object.assign(l, { pestFree: libre, vetScore: score, vetNotes: notas, isVerified: true });
  return fakeTx();
};

export const pujar = async (comprador: string, id: number, monto: number) => {
  await wait();
  const l = lotes.find((x) => x.id === id);
  if (!l) throw new Error("El lote no existe");
  if (!l.isVerified || !l.pestFree) throw new Error("El lote debe estar verificado y libre de plagas");
  if (l.isSettled) throw new Error("La subasta ya fue cerrada");
  if (monto <= l.highestBid) throw new Error("La puja debe superar la oferta actual");
  Object.assign(l, { highestBid: monto, highestBidder: comprador });
  return fakeTx();
};

export const liquidar = async (_comprador: string, id: number) => {
  await wait();
  const l = lotes.find((x) => x.id === id);
  if (!l) throw new Error("El lote no existe");
  if (l.isSettled) throw new Error("Este lote ya fue pagado");
  l.isSettled = true;
  return fakeTx();
};

export const getLote = async (id: number): Promise<Lote> => {
  const l = lotes.find((x) => x.id === id);
  if (!l) throw new Error("El lote no existe");
  return { ...l };
};

export const listarLotes = async (_max = 10): Promise<Lote[]> => lotes.map((l) => ({ ...l }));
