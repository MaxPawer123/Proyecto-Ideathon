export type Lote = {
  id: number;
  seller: string;
  vet: string;
  headCount: number;
  basePrice: number; // USDC en unidades normales (no stroops)
  highestBid: number;
  highestBidder: string;
  pestFree: boolean;
  vetScore: number;
  vetNotes: string;
  isVerified: boolean;
  isSettled: boolean;
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
