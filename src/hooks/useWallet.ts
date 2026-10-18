// =====================================================
// GanadoChain — Hook React para Stellar/Wallet
// =====================================================

'use client';

import { useState, useCallback } from 'react';

// 👇 Cambia este import para alternar entre real y mock:
// import { connectWallet, getAccountBalance } from '@/services/sorobanService';
import { connectWallet, getAccountBalance } from '@/services/mockService';

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balances: { xlm: string; usdc: string } | null;
  error: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    isConnecting: false,
    balances: null,
    error: null,
  });

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    const result = await connectWallet();

    if (result.success && result.data) {
      const balances = await getAccountBalance(result.data.publicKey);
      setWallet({
        publicKey: result.data.publicKey,
        isConnected: true,
        isConnecting: false,
        balances,
        error: null,
      });
    } else {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: result.error || 'Error desconocido',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      publicKey: null,
      isConnected: false,
      isConnecting: false,
      balances: null,
      error: null,
    });
  }, []);

  return { ...wallet, connect, disconnect };
}
