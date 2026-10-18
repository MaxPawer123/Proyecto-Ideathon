'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RoleView, CattleLot, CreateLotFormData } from '@/types/lots';
import { INITIAL_LOTS } from '@/types/lots';

export function useAuction() {
  const [role, setRole] = useState<RoleView>('BUYER');
  const [walletConnected, setWalletConnected] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>('GBUYER77X...99S2');

  const [lots, setLots] = useState<CattleLot[]>(INITIAL_LOTS);
  const [selectedLotId, setSelectedLotId] = useState<string>('LOTE-041');
  const [secondsLeft, setSecondsLeft] = useState<number>(872);

  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [showDemoBar, setShowDemoBar] = useState<boolean>(true);

  const selectedLot = lots.find((l) => l.id === selectedLotId) || lots[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}m ${String(remSecs).padStart(2, '0')}s`;
  }, []);


  const handleConnectWallet = useCallback(async () => {
    setWalletConnected(true);
    if (role === 'COMPANY') setWalletAddress('GSELLER55...11K9');
    if (role === 'BUYER') setWalletAddress('GBUYER77X...99S2');

  }, [role]);

  const handleCreateLot = useCallback(async (formData: CreateLotFormData) => {
    setIsProcessingTx(true);

    setTimeout(() => {
      const newLot: CattleLot = {
        id: `LOTE-04${lots.length + 1}`,
        title: formData.title,
        breed: formData.breed,
        headCount: formData.headCount,
        avgWeightKg: formData.avgWeightKg,
        location: formData.location,
        sellerAddress: walletAddress,
        imageUrl:
          formData.imageUrl ||
          'https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?auto=format&fit=crop&w=1000&q=80',

        basePriceUsdc: formData.priceUsdc,
        currentBidUsdc: formData.priceUsdc,
        highestBidder: null,
        vetVerified: false,
        pestFree: false,
        footAndMouthVaccine: true,
        vetScore: 0,
        status: 'PENDING_VET',
        bids: [],
      };
      setLots((prev) => [newLot, ...prev]);
      setSelectedLotId(newLot.id);
      setIsProcessingTx(false);
    }, 800);
  }, [lots.length, walletAddress]);

  const handlePlaceBid = useCallback(async (bidAmount: number) => {
    if (!bidAmount || bidAmount <= selectedLot.currentBidUsdc) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === selectedLot.id
          ? {
            ...lot,
            currentBidUsdc: bidAmount,
            highestBidder: `Comprador (${walletAddress})`,
            bids: [
              {
                id: String(Date.now()),
                bidder: `Comprador (${walletAddress})`,
                amountUsdc: bidAmount,
                timestamp: `${nowStr} hrs`,
              },
              ...lot.bids,
            ],
          }
          : lot
      )
    );
  }, [selectedLot.id, selectedLot.currentBidUsdc, walletAddress]);

  const handleSettleAuction = useCallback(async () => {
    if (!selectedLot.vetVerified || !selectedLot.pestFree) return;
    setIsProcessingTx(true);

    setTimeout(() => {
      setLots((prev) =>
        prev.map((lot) =>
          lot.id === selectedLot.id
            ? {
              ...lot,
              status: 'SETTLED' as const,
              highestBidder: `Comprador (${walletAddress})`,
              txHashSettle: '9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
            }
            : lot
        )
      );
      setIsProcessingTx(false);
    }, 1000);
  }, [selectedLot.id, selectedLot.vetVerified, selectedLot.pestFree, walletAddress]);

  const toggleVetVerificationDemo = useCallback(() => {
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === selectedLot.id
          ? {
            ...lot,
            vetVerified: !lot.vetVerified,
            pestFree: !lot.vetVerified,
            vetScore: !lot.vetVerified ? 5 : 0,
            vetAddress: 'Dr. M. Salvatierra - Reg. SENASAG #4021',
            status: !lot.vetVerified ? ('ACTIVE_AUCTION' as const) : ('PENDING_VET' as const),
            txHashVet: !lot.vetVerified
              ? '8f9d2a1b4c6e8f0a2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c'
              : undefined,
          }
          : lot
      )
    );
  }, [selectedLot.id]);

  const resetHappyPathDemo = useCallback(() => {
    setLots(INITIAL_LOTS);
    setSelectedLotId('LOTE-041');
  }, []);

  return {
    role, setRole,
    walletConnected, walletAddress,
    lots, selectedLot, selectedLotId, setSelectedLotId,
    secondsLeft, formatTime,
    isProcessingTx,
    showDemoBar, setShowDemoBar,
    handleConnectWallet,
    handleCreateLot,
    handlePlaceBid,
    handleSettleAuction,
    toggleVetVerificationDemo,
    resetHappyPathDemo,
  };
}
