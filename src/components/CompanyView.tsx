'use client';

import React, { useState, useRef } from 'react';
import type { CattleLot, CreateLotFormData } from '@/types/lots';
import { formatNumber } from '@/types/lots';

const PRESET_CATTLE_IMAGES = [
  { name: 'Nelore Puro', url: 'https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Angus Negro', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Brahman Cabaña', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Brangus Colorado', url: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1000&q=80' },
];

interface CompanyViewProps {
  lots: CattleLot[];
  walletAddress: string;
  isProcessingTx: boolean;
  onCreateLot: (formData: CreateLotFormData) => void;
}

export default function CompanyView({ lots, isProcessingTx, onCreateLot }: CompanyViewProps) {
  const [newTitle, setNewTitle] = useState('400 Terneros Brangus - Estancia San Antonio');
  const [newBreed, setNewBreed] = useState('Brangus Colorado');
  const [newHeads, setNewHeads] = useState(400);
  const [newWeight, setNewWeight] = useState(260);
  const [newLocation, setNewLocation] = useState('San Ignacio de Velasco, Santa Cruz');
  const [newPrice, setNewPrice] = useState(72000);
  const [newImageUrl, setNewImageUrl] = useState(PRESET_CATTLE_IMAGES[3].url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setNewImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateLot({ title: newTitle, breed: newBreed, headCount: Number(newHeads), avgWeightKg: Number(newWeight), location: newLocation, priceUsdc: Number(newPrice), imageUrl: newImageUrl });
  };

  return (
    <div className="grid-12-5" style={{ alignItems: 'flex-start' }}>
      {/* Form */}
      <div className="card">
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '14px' }}>
          <div className="section-title" style={{ margin: 0 }}>Inscribir Nuevo Lote a Remate</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
            Registra el lote en el contrato Soroban (<code>create_lot</code>)
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Image */}
          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Fotografía del Ganado</label>
            <img src={newImageUrl} alt="Vista previa" className="preview-img" style={{ marginBottom: '6px' }} />
            <button type="button" className="btn-upload" onClick={() => fileInputRef.current?.click()}>
              Subir imagen desde tu equipo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />

            <div style={{ marginTop: '8px', fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '4px' }}>
              O selecciona una foto de raza:
            </div>
            <div className="preset-grid">
              {PRESET_CATTLE_IMAGES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => { setNewImageUrl(p.url); setNewBreed(p.name); }}
                  className={`preset-btn${newImageUrl === p.url ? ' selected' : ''}`}
                >
                  <img src={p.url} alt={p.name} />
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div style={{ marginBottom: '10px' }}>
            <label className="form-label">Descripción del Lote y Estancia</label>
            <input type="text" required className="form-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>

          <div className="grid-2" style={{ marginBottom: '10px' }}>
            <div>
              <label className="form-label">Raza</label>
              <input type="text" required className="form-input" value={newBreed} onChange={(e) => setNewBreed(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Cabezas</label>
              <input type="number" required className="form-input" value={newHeads} onChange={(e) => setNewHeads(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '10px' }}>
            <div>
              <label className="form-label">Peso Prom. (kg)</label>
              <input type="number" required className="form-input" value={newWeight} onChange={(e) => setNewWeight(Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Precio Base (USDC)</label>
              <input type="number" required className="form-input" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} style={{ fontFamily: 'monospace', fontWeight: 700 }} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="form-label">Ubicación</label>
            <input type="text" required className="form-input" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
          </div>

          {/* Net preview */}
          <div className="net-box" style={{ marginBottom: '12px' }}>
            <div className="net-row">
              <span>Líquido a recibir (99.75%):</span>
              <strong>${formatNumber(newPrice * 0.9975, 2)} USDC</strong>
            </div>
            <div className="net-row" style={{ marginTop: '4px' }}>
              <span>Derecho de remate (0.25%):</span>
              <span>${formatNumber(newPrice * 0.0025, 2)} USDC</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isProcessingTx}>
            {isProcessingTx ? 'Firmando en Stellar...' : 'Publicar Lote en Remate'}
          </button>
        </form>
      </div>

      {/* Lot list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="section-title" style={{ margin: 0 }}>Estado de Mis Lotes</span>
          <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{lots.length} registrados</span>
        </div>

        {lots.map((lot) => (
          <div key={lot.id} className="lot-table-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={lot.imageUrl} alt={lot.title} className="lot-table-thumb" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', background: '#eee', padding: '1px 6px', borderRadius: '3px', border: '1px solid #ccc' }}>{lot.id}</span>
                  <span className={
                    lot.status === 'SETTLED' ? 'lot-status-done' :
                      lot.vetVerified ? 'lot-status-ok' : 'lot-status-pend'
                  }>
                    {lot.status === 'SETTLED' ? '✓ Liquidado' : lot.vetVerified ? '• En pista (Vet OK)' : '• Pendiente veterinario'}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{lot.title}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {lot.headCount} cab · {lot.avgWeightKg} kg · Oferta: ${formatNumber(lot.currentBidUsdc)} USDC
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase' }}>Neto Productor (99.75%)</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#2d6a4f' }}>
                ${formatNumber(lot.currentBidUsdc * 0.9975, 2)} USDC
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
