'use client';

import React from 'react';
import type { CattleLot } from '@/types/lots';

interface DemoBarProps {
  show: boolean;
  onClose: () => void;
  selectedLot: CattleLot;
  onToggleVetVerification: () => void;
  onSimulateBid: (amount: number) => void;
  onResetDemo: () => void;
}

export default function DemoBar({ show, onClose, selectedLot, onToggleVetVerification, onSimulateBid, onResetDemo }: DemoBarProps) {
  if (!show) return null;

  return (
    <div className="demo-bar">
      <span style={{ fontWeight: 600 }}>🔧 Controles de Simulación:</span>
      <div className="demo-btns">
        <button className="btn-demo" onClick={onToggleVetVerification}>
          {selectedLot.vetVerified ? 'Quitar Firma Vet' : 'Simular Firma Vet (5★)'}
        </button>
        <button className="btn-demo" onClick={() => onSimulateBid(2500)}>
          Simular Puja +$2,500
        </button>
        <button className="btn-demo" onClick={onResetDemo}>
          Reiniciar Lote 100k
        </button>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
