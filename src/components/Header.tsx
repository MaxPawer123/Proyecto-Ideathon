'use client';

import React from 'react';
import type { RoleView } from '@/types/lots';

interface HeaderProps {
  role: RoleView;
  setRole: (role: RoleView) => void;
  walletConnected: boolean;
  walletAddress: string;
  onConnectWallet: () => void;
}

export default function Header({ role, setRole, walletConnected, walletAddress, onConnectWallet }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-logo">R</div>
          <div>
            <div className="brand-name">Remates Rurales &amp; Cía.</div>
            <div className="brand-sub">Mesa de Remate Ganadero · USDC · Soroban</div>
          </div>
          <span className="badge" style={{ marginLeft: '8px' }}>Red Stellar (Testnet)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="tab-group">
            <button
              onClick={() => setRole('BUYER')}
              className={`tab-btn${role === 'BUYER' ? ' active' : ''}`}
            >
              Sala de Subasta
            </button>
            <button
              onClick={() => setRole('COMPANY')}
              className={`tab-btn${role === 'COMPANY' ? ' active' : ''}`}
            >
              Empresa Ganadera
            </button>
          </div>

          <button onClick={onConnectWallet} className="btn-wallet">
            {' '}
            {walletConnected ? (
              <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{walletAddress}</span>
            ) : (
              'Conectar Billetera'
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
