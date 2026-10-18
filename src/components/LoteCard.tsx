"use client";

import { Lote, calcularComision, corto } from "@/lib/types";

export default function LoteCard({ lote }: { lote: Lote }) {
  const { fee, vendedor } = calcularComision(lote.highestBid);

  const estado = lote.isSettled
    ? { t: "Pagado", c: "status-settled", icon: "✅" }
    : lote.isVerified && lote.pestFree
    ? { t: "Verificado · En subasta", c: "status-verified", icon: "🟢" }
    : lote.isVerified
    ? { t: "Rechazado por plagas", c: "status-rejected", icon: "🔴" }
    : { t: "Esperando veterinario", c: "status-pending", icon: "⏳" };

  const stars = lote.isVerified
    ? "★".repeat(lote.vetScore) + "☆".repeat(5 - lote.vetScore)
    : "Sin calificar";

  return (
    <article className="lote-card" id={`lote-${lote.id}`}>
      {/* Glow effect */}
      <div className="lote-card-glow" />

      <header className="lote-card-header">
        <div className="lote-card-title-group">
          <h3 className="lote-card-title">
            Lote #{lote.id}
          </h3>
          <span className="lote-card-breed">{lote.breed ?? "Ganado"}</span>
        </div>
        <span className={`lote-card-status ${estado.c}`}>
          {estado.icon} {estado.t}
        </span>
      </header>

      <div className="lote-card-stats">
        <div className="stat-item">
          <span className="stat-icon">🐄</span>
          <div>
            <span className="stat-value">{lote.headCount.toLocaleString()}</span>
            <span className="stat-label">cabezas</span>
          </div>
        </div>
        {lote.weightKg > 0 && (
          <div className="stat-item">
            <span className="stat-icon">⚖️</span>
            <div>
              <span className="stat-value">{lote.weightKg.toLocaleString()}</span>
              <span className="stat-label">kg total</span>
            </div>
          </div>
        )}
        {lote.location && (
          <div className="stat-item">
            <span className="stat-icon">📍</span>
            <div>
              <span className="stat-value">{lote.location}</span>
              <span className="stat-label">ubicación</span>
            </div>
          </div>
        )}
      </div>

      <dl className="lote-card-details">
        <div className="detail-row">
          <dt>Ganadero</dt>
          <dd className="address-tag">{corto(lote.seller)}</dd>
        </div>
        <div className="detail-row">
          <dt>Veterinario</dt>
          <dd className="address-tag">{corto(lote.vet)}</dd>
        </div>
        <div className="detail-row">
          <dt>Calificación</dt>
          <dd className="stars">{stars}</dd>
        </div>
        <div className="detail-row">
          <dt>Certificado</dt>
          <dd className="vet-notes">{lote.vetNotes}</dd>
        </div>
      </dl>

      <div className="lote-card-pricing">
        <div className="price-row">
          <span className="price-label">Precio base</span>
          <span className="price-value">{lote.basePrice.toLocaleString()} USDC</span>
        </div>
        <div className="price-row highlight">
          <span className="price-label">🔥 Mejor puja</span>
          <span className="price-value bid">
            {lote.highestBid.toLocaleString()} USDC
            <span className="bidder-tag">{corto(lote.highestBidder)}</span>
          </span>
        </div>
      </div>

      <div className="lote-card-breakdown">
        <p className="breakdown-title">Desglose del pago</p>
        <div className="breakdown-row">
          <span>Comisión plataforma (0.25%)</span>
          <strong>{fee.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC</strong>
        </div>
        <div className="breakdown-row">
          <span>Pago al ganadero (99.75%)</span>
          <strong>{vendedor.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC</strong>
        </div>
      </div>

      {lote.isVerified && lote.pestFree && (
        <div className="lote-card-verified-badge">
          <span className="badge-icon">🛡️</span>
          <span>VERIFICADO ON-CHAIN EN STELLAR</span>
        </div>
      )}
    </article>
  );
}
