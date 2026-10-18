'use client';

import React, { useState } from 'react';
import type { CattleLot } from '@/types/lots';
import { formatNumber } from '@/types/lots';

interface BuyerViewProps {
  lots: CattleLot[];
  selectedLot: CattleLot;
  selectedLotId: string;
  setSelectedLotId: (id: string) => void;
  secondsLeft: number;
  formatTime: (secs: number) => string;
  isProcessingTx: boolean;
  onPlaceBid: (amount: number) => void;
  onSettleAuction: () => void;
}

export default function BuyerView({
  lots,
  selectedLot,
  selectedLotId,
  setSelectedLotId,
  secondsLeft,
  formatTime,
  isProcessingTx,
  onPlaceBid,
  onSettleAuction,
}: BuyerViewProps) {
  const [customBid, setCustomBid] = useState('');

  const totalAmount = selectedLot.currentBidUsdc;
  const platformFee = +(totalAmount * 0.0025).toFixed(2);
  const sellerNet = +(totalAmount - platformFee).toFixed(2);
  const traditionalFee = +(totalAmount * 0.045).toFixed(2);
  const savedVsBanks = +(traditionalFee - platformFee).toFixed(2);

  const handleCustomBid = () => {
    const amount = Number(customBid);
    if (amount > 0) { onPlaceBid(amount); setCustomBid(''); }
  };

  return (
    <div>
      {/* Info strip */}
      <div className="info-strip">
        <span>Comisión Soroban: <strong>0.25% fijo</strong> (Feria trad.: 4.5–6%)</span>
        <span className="info-sep" />
        <span>Moneda: <strong>USDC (1:1 Dólar)</strong></span>
        <span className="info-sep" />
        <span>Pago: <strong>Liberación contra Certificado Veterinario</strong></span>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#aaa' }}>CDSC...SOROBAN-V1</span>
      </div>

      {/* Lot grid */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="section-title" style={{ margin: 0 }}>Corrales en Remate Hoy</span>
        <span style={{ fontSize: '11px', color: '#888' }}>Haz clic en un lote para ver su planilla</span>
      </div>

      <div className="lot-grid">
        {lots.map((lot) => (
          <div
            key={lot.id}
            className={`lot-card${lot.id === selectedLotId ? ' selected' : ''}`}
            onClick={() => setSelectedLotId(lot.id)}
          >
            <div className="lot-img-wrap">
              <img src={lot.imageUrl} alt={lot.title} className="lot-img" />
              <div className="lot-badges">
                <span className="badge-id">{lot.id}</span>
                {lot.vetVerified ? (
                  <span className="badge-ok">✓ Sanidad ({lot.vetScore}/5)</span>
                ) : (
                  <span className="badge-warn">Sin Firma Vet</span>
                )}
              </div>
              {lot.status === 'SETTLED' && (
                <div className="sold-overlay">
                  <span className="sold-label">Lote Vendido</span>
                </div>
              )}
            </div>
            <div className="lot-body">
              <div className="lot-title">{lot.title}</div>
              <div className="lot-loc">{lot.location}</div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase' }}>Oferta Actual</div>
                  <div className="lot-price">${formatNumber(lot.currentBidUsdc)} USDC</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase' }}>Detalle</div>
                  <div className="lot-detail">{lot.headCount} cab · {lot.avgWeightKg} kg</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail + Bid panel */}
      <div className="grid-12-7" style={{ alignItems: 'flex-start' }}>
        {/* Left: detail */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src={selectedLot.imageUrl} alt={selectedLot.title} className="detail-img" />
              <div className="time-badge">
                🕐
                <div>
                  <span className="time-label">Martillo baja en:</span>
                  <span className="time-val">{formatTime(secondsLeft)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888' }}>Expediente #{selectedLot.id}</div>
                <div style={{ fontWeight: 700, fontSize: '18px', marginTop: '2px' }}>{selectedLot.title}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  Procedencia: <strong>{selectedLot.location}</strong> · Vendedor: <span style={{ fontFamily: 'monospace' }}>{selectedLot.sellerAddress}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid" style={{ marginBottom: '12px' }}>
                <div className="stat-cell">
                  <span className="stat-label">Cantidad</span>
                  <span className="stat-val">{selectedLot.headCount} Cab.</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-label">Raza</span>
                  <span className="stat-val">{selectedLot.breed}</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-label">Peso Prom.</span>
                  <span className="stat-val">{selectedLot.avgWeightKg} kg</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-label">Kg Totales</span>
                  <span className="stat-val green">{formatNumber(selectedLot.headCount * selectedLot.avgWeightKg)} kg</span>
                </div>
              </div>

              {/* Vet block */}
              <div className={selectedLot.vetVerified ? 'vet-ok' : 'vet-warn'} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div className="vet-title">
                      {selectedLot.vetVerified
                        ? 'Certificado Sanitario Firmado On-Chain'
                        : 'Revisión Sanitaria Pendiente'}
                    </div>
                    <div className="vet-text">
                      {selectedLot.vetVerified
                        ? `Libre de plagas y garrapatas · Vacunación al día · Calificación: ${selectedLot.vetScore}/5`
                        : 'Los fondos no se liberan hasta que el veterinario firme la inspección on-chain.'}
                    </div>
                    {selectedLot.txHashVet && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${selectedLot.txHashVet}`}
                        target="_blank" rel="noreferrer"
                        className="vet-link"
                      >
                        Ver acta en Stellar Expert ({selectedLot.txHashVet.slice(0, 10)}…) ↗
                      </a>
                    )}
                  </div>
                  {selectedLot.vetVerified && (
                    <div className="vet-score">{'★'.repeat(selectedLot.vetScore)} ({selectedLot.vetScore}.0)</div>
                  )}
                </div>
              </div>

              {/* Ledger */}
              <div className="ledger">
                <div className="ledger-title">Simulación de Liquidación — settle_auction()</div>
                <div className="ledger-row">
                  <span>Valor Bruto (depositado por comprador):</span>
                  <strong>{formatNumber(totalAmount, 2)} USDC</strong>
                </div>
                <div className="ledger-row">
                  <span>Retención plataforma (0.25%):</span>
                  <span className="minus">- {formatNumber(platformFee, 2)} USDC</span>
                </div>
                <div className="ledger-row total">
                  <span>LÍQUIDO AL PRODUCTOR (99.75%):</span>
                  <span>{formatNumber(sellerNet, 2)} USDC</span>
                </div>
                <div className="ledger-footer">
                  <span>Comisión feria tradicional (4.5%): ${formatNumber(traditionalFee)} USD</span>
                  <strong>Ahorro productor: ${formatNumber(savedVsBanks)} USD</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: bid panel */}
        <div className="card">
          {/* Current bid */}
          <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div className="bid-label">Mejor Postura en Pista</div>
              <div className="bid-current">${formatNumber(selectedLot.currentBidUsdc)} <span style={{ fontSize: '14px', fontWeight: 400, color: '#888' }}>USDC</span></div>
              <div className="bid-sub">Postor: <strong>{selectedLot.highestBidder || 'Sin posturas'}</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="bid-label">Base de Salida</div>
              <div className="bid-base">${formatNumber(selectedLot.basePriceUsdc)} USDC</div>
            </div>
          </div>

          {selectedLot.status === 'SETTLED' ? (
            <div className="settled-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px' }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Remate Cerrado y Liquidado</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Fondos transferidos de forma irrevocable.</div>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '5px', padding: '8px', marginBottom: '10px' }}>
                <div className="settled-row">
                  <span>Acreditado al ganadero (99.75%):</span>
                  <span className="green">{formatNumber(sellerNet, 2)} USDC</span>
                </div>
                <div className="settled-row">
                  <span>Comisión de remate (0.25%):</span>
                  <span>{formatNumber(platformFee, 2)} USDC</span>
                </div>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${selectedLot.txHashSettle}`}
                target="_blank" rel="noreferrer"
                className="btn-explorer"
              >
                Ver recibo on-chain en Stellar Expert ↗
              </a>
            </div>
          ) : (
            <>
              {/* Quick bids */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: '8px' }}>
                  1. Cantar Puja en Pista
                </div>
                <div className="bid-buttons">
                  {[500, 1000, 2500].map((inc) => (
                    <button key={inc} className="btn-bid" onClick={() => onPlaceBid(selectedLot.currentBidUsdc + inc)}>
                      +${formatNumber(inc)}
                    </button>
                  ))}
                </div>
                <div className="bid-custom">
                  <input
                    type="number"
                    className="input-bid"
                    placeholder={`Monto mayor a $${selectedLot.currentBidUsdc}`}
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                  />
                  <button className="btn-submit" onClick={handleCustomBid}>Ofertar</button>
                </div>
              </div>

              {/* Settle */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: '8px' }}>
                  2. Cierre de Remate y Pago en Escrow
                </div>
                <button
                  className="btn-settle"
                  onClick={onSettleAuction}
                  disabled={!selectedLot.vetVerified || isProcessingTx}
                >
                  {selectedLot.vetVerified
                    ? isProcessingTx
                      ? 'Procesando settle_auction()...'
                      : `Adjudicar y Depositar $${formatNumber(totalAmount)} USDC`
                    : 'Pago Bloqueado (Falta Certificado Vet)'}
                </button>
                <div className="settle-note">
                  El contrato retiene <strong>${formatNumber(platformFee, 2)} USDC (0.25%)</strong> y transfiere <strong>${formatNumber(sellerNet, 2)} USDC (99.75%)</strong> al productor.
                </div>
              </div>
            </>
          )}

          {/* Bid history */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
              Historial de Posturas
            </div>
            <div className="bid-history">
              {selectedLot.bids.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#aaa', padding: '6px 0' }}>Sin ofertas registradas.</p>
              ) : (
                selectedLot.bids.map((bid, idx) => (
                  <div key={bid.id} className={`bid-row${idx === 0 ? ' top' : ' rest'}`}>
                    <div>
                      <span>{bid.bidder}</span>
                      <span className="bid-time">{bid.timestamp}</span>
                    </div>
                    <span className="bid-amount">${formatNumber(bid.amountUsdc)} USDC</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
