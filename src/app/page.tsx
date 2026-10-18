'use client';

import React from 'react';
import { useAuction } from '@/hooks/useAuction';
import Header from '@/components/Header';
import BuyerView from '@/components/BuyerView';
import CompanyView from '@/components/CompanyView';
import DemoBar from '@/components/DemoBar';

export default function AgroSorobanApp() {
  const auction = useAuction();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <Header
        role={auction.role}
        setRole={auction.setRole}
        walletConnected={auction.walletConnected}
        walletAddress={auction.walletAddress}
        onConnectWallet={auction.handleConnectWallet}
      />

      <main className="page-wrap">
        {auction.role === 'BUYER' && (
          <BuyerView
            lots={auction.lots}
            selectedLot={auction.selectedLot}
            selectedLotId={auction.selectedLotId}
            setSelectedLotId={auction.setSelectedLotId}
            secondsLeft={auction.secondsLeft}
            formatTime={auction.formatTime}
            isProcessingTx={auction.isProcessingTx}
            onPlaceBid={auction.handlePlaceBid}
            onSettleAuction={auction.handleSettleAuction}
          />
        )}

        {auction.role === 'COMPANY' && (
          <CompanyView
            lots={auction.lots}
            walletAddress={auction.walletAddress}
            isProcessingTx={auction.isProcessingTx}
            onCreateLot={auction.handleCreateLot}
          />
        )}
      </main>

      <DemoBar
        show={auction.showDemoBar}
        onClose={() => auction.setShowDemoBar(false)}
        selectedLot={auction.selectedLot}
        onToggleVetVerification={auction.toggleVetVerificationDemo}
        onSimulateBid={(amount) => auction.handlePlaceBid(auction.selectedLot.currentBidUsdc + amount)}
        onResetDemo={auction.resetHappyPathDemo}
      />
    </div>
  );
}