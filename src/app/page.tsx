"use client";
import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  crearLote,
  verificarLote,
  pujar,
  liquidar,
  listarLotes,
} from "@/lib/soroban";
import { Lote, TxResult, corto } from "@/lib/types";
import { CONFIG, Rol } from "@/lib/config";
import LoteCard from "@/components/LoteCard";

const ROLES: { id: Rol; label: string; icon: string; desc: string }[] = [
  { id: "ganadero", label: "Empresa Agropecuaria", icon: "🐄", desc: "Publica lotes de ganado para subasta" },
  { id: "veterinario", label: "Veterinario", icon: "🩺", desc: "Certifica la sanidad de los lotes" },
  { id: "comprador", label: "Comprador", icon: "💰", desc: "Puja y adquiere lotes verificados" },
];

export default function Home() {
  const [rol, setRol] = useState<Rol>("ganadero");
  const [addr, setAddr] = useState("");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Formularios — Ganadero
  const [vetAddr, setVetAddr] = useState(CONFIG.addr.veterinario);
  const [cabezas, setCabezas] = useState(500);
  const [precio, setPrecio] = useState(100);
  const [raza, setRaza] = useState("Nelore");
  const [peso, setPeso] = useState(225000);
  const [ubicacion, setUbicacion] = useState("Santa Cruz, Bolivia");

  // Formularios — Veterinario
  const [loteId, setLoteId] = useState(1);
  const [libre, setLibre] = useState(true);
  const [score, setScore] = useState(5);
  const [notas, setNotas] = useState("SENASAG_SIN_PLAGAS_OK");

  // Formularios — Comprador
  const [monto, setMonto] = useState(120);
  const [loteIdComprador, setLoteIdComprador] = useState(1);

  const refrescar = useCallback(async () => {
    try {
      setLotes(await listarLotes());
    } catch {
      /* sin contrato aún */
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const esperada = CONFIG.addr[rol];
  const cuentaEquivocada = !!addr && !!esperada && addr !== esperada;

  const ejecutar = async (fn: () => Promise<TxResult>) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ ok: true, text: "✅ Transacción confirmada en la blockchain", url: r.explorerUrl });
      await refrescar();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      setAddr(await connectWallet());
      setMsg({ ok: true, text: "Wallet conectada exitosamente" });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setConnecting(false);
    }
  };

  const sinWallet = !addr;
  const currentRole = ROLES.find((r) => r.id === rol)!;

  return (
    <main className="app-container">
      {/* Animated background particles */}
      <div className="bg-particles">
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
      </div>

      {/* ── Header ── */}
      <header className="app-header" id="app-header">
        <div className="header-brand">
          <div className="logo-container">
            <span className="logo-icon">⛓️</span>
            <div>
              <h1 className="app-title">GanadoChain</h1>
              <p className="app-subtitle">
                Remate de ganado verificado · Stellar Testnet · Comisión 0.25%
              </p>
            </div>
          </div>
          <div className="header-network-badge">
            <span className="network-dot" />
            Testnet
          </div>
        </div>
        <button
          id="connect-wallet-btn"
          className={`btn-connect ${addr ? "connected" : ""} ${connecting ? "connecting" : ""}`}
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <span className="spinner" />
              Conectando…
            </>
          ) : addr ? (
            <>
              <span className="wallet-icon">🟢</span>
              {corto(addr)}
            </>
          ) : (
            <>
              <span className="wallet-icon">🔗</span>
              Conectar Freighter
            </>
          )}
        </button>
      </header>

      {/* ── Role Selector ── */}
      <nav className="role-nav" id="role-nav">
        {ROLES.map((r) => (
          <button
            key={r.id}
            id={`role-${r.id}`}
            onClick={() => setRol(r.id)}
            className={`role-tab ${rol === r.id ? "active" : ""}`}
          >
            <span className="role-icon">{r.icon}</span>
            <span className="role-label">{r.label}</span>
          </button>
        ))}
      </nav>

      {/* Wrong account warning */}
      {cuentaEquivocada && (
        <div className="alert alert-warning" id="wrong-account-alert">
          <span className="alert-icon">⚠️</span>
          <p>
            Freighter tiene la cuenta <strong>{corto(addr)}</strong>, pero el rol{" "}
            <strong>{currentRole.label}</strong> usa <strong>{corto(esperada)}</strong>.
            Cambia de cuenta en Freighter y pulsa &quot;Conectar Freighter&quot;.
          </p>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="main-grid">
        {/* ── Action Panel ── */}
        <section className="panel action-panel" id="action-panel">
          <div className="panel-header">
            <span className="panel-icon">{currentRole.icon}</span>
            <div>
              <h2 className="panel-title">{currentRole.label}</h2>
              <p className="panel-desc">{currentRole.desc}</p>
            </div>
          </div>

          <div className="panel-body">
            {/* ── Ganadero Form ── */}
            {rol === "ganadero" && (
              <form
                className="form"
                id="form-ganadero"
                onSubmit={(e) => {
                  e.preventDefault();
                  ejecutar(() => crearLote(addr, vetAddr, cabezas, precio, raza, peso, ubicacion));
                }}
              >
                <h3 className="form-title">Publicar nuevo lote</h3>

                <div className="form-grid">
                  <label className="form-field">
                    <span className="field-label">Raza del ganado</span>
                    <input
                      id="input-raza"
                      className="field-input"
                      value={raza}
                      onChange={(e) => setRaza(e.target.value)}
                      placeholder="Ej: Nelore, Angus…"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Cabezas de ganado</span>
                    <input
                      id="input-cabezas"
                      className="field-input"
                      type="number"
                      min={1}
                      value={cabezas}
                      onChange={(e) => setCabezas(+e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Peso total (kg)</span>
                    <input
                      id="input-peso"
                      className="field-input"
                      type="number"
                      min={1}
                      value={peso}
                      onChange={(e) => setPeso(+e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Ubicación</span>
                    <input
                      id="input-ubicacion"
                      className="field-input"
                      value={ubicacion}
                      onChange={(e) => setUbicacion(e.target.value)}
                      placeholder="Ej: Santa Cruz, Bolivia"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Precio base (USDC)</span>
                    <input
                      id="input-precio"
                      className="field-input"
                      type="number"
                      min={1}
                      value={precio}
                      onChange={(e) => setPrecio(+e.target.value)}
                    />
                  </label>

                  <label className="form-field full-width">
                    <span className="field-label">Dirección del veterinario (G...)</span>
                    <input
                      id="input-vet-addr"
                      className="field-input mono"
                      value={vetAddr}
                      onChange={(e) => setVetAddr(e.target.value)}
                      placeholder="G..."
                    />
                  </label>
                </div>

                <button
                  id="btn-publicar-lote"
                  className="btn-primary"
                  type="submit"
                  disabled={busy || sinWallet || !vetAddr}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Firmando transacción…
                    </>
                  ) : (
                    "🐄 Publicar lote"
                  )}
                </button>
              </form>
            )}

            {/* ── Veterinario Form ── */}
            {rol === "veterinario" && (
              <form
                className="form"
                id="form-veterinario"
                onSubmit={(e) => {
                  e.preventDefault();
                  ejecutar(() => verificarLote(addr, loteId, libre, score, notas));
                }}
              >
                <h3 className="form-title">Certificar lote</h3>

                <div className="form-grid">
                  <label className="form-field">
                    <span className="field-label">Número de lote</span>
                    <input
                      id="input-lote-id-vet"
                      className="field-input"
                      type="number"
                      min={1}
                      value={loteId}
                      onChange={(e) => setLoteId(+e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Calificación (1 a 5)</span>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`star-btn ${s <= score ? "active" : ""}`}
                          onClick={() => setScore(s)}
                        >
                          {s <= score ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="form-field checkbox-field">
                    <input
                      id="input-libre-plagas"
                      type="checkbox"
                      className="field-checkbox"
                      checked={libre}
                      onChange={(e) => setLibre(e.target.checked)}
                    />
                    <span className="field-label">
                      ✅ Libre de plagas y garrapatas
                    </span>
                  </label>

                  <label className="form-field full-width">
                    <span className="field-label">Referencia del certificado</span>
                    <input
                      id="input-notas"
                      className="field-input"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej: SENASAG_SIN_PLAGAS_OK"
                    />
                  </label>
                </div>

                <button
                  id="btn-firmar-certificado"
                  className="btn-primary btn-vet"
                  type="submit"
                  disabled={busy || sinWallet}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Firmando…
                    </>
                  ) : (
                    "🩺 Firmar certificado"
                  )}
                </button>
              </form>
            )}

            {/* ── Comprador Form ── */}
            {rol === "comprador" && (
              <form
                className="form"
                id="form-comprador"
                onSubmit={(e) => {
                  e.preventDefault();
                  ejecutar(() => pujar(addr, loteIdComprador, monto));
                }}
              >
                <h3 className="form-title">Pujar y pagar</h3>

                <div className="form-grid">
                  <label className="form-field">
                    <span className="field-label">Número de lote</span>
                    <input
                      id="input-lote-id-comprador"
                      className="field-input"
                      type="number"
                      min={1}
                      value={loteIdComprador}
                      onChange={(e) => setLoteIdComprador(+e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Tu puja (USDC)</span>
                    <input
                      id="input-monto"
                      className="field-input"
                      type="number"
                      min={1}
                      value={monto}
                      onChange={(e) => setMonto(+e.target.value)}
                    />
                  </label>
                </div>

                <div className="btn-group">
                  <button
                    id="btn-pujar"
                    className="btn-primary"
                    type="submit"
                    disabled={busy || sinWallet}
                  >
                    {busy ? (
                      <>
                        <span className="spinner" /> Firmando…
                      </>
                    ) : (
                      "💰 Pujar"
                    )}
                  </button>
                  <button
                    id="btn-pagar"
                    className="btn-primary btn-settle"
                    type="button"
                    disabled={busy || sinWallet}
                    onClick={() => ejecutar(() => liquidar(addr, loteIdComprador))}
                  >
                    {busy ? (
                      <>
                        <span className="spinner" /> Firmando…
                      </>
                    ) : (
                      "🏦 Pagar lote ganado"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* No wallet tip */}
            {sinWallet && (
              <p className="no-wallet-tip">
                🔗 Conecta Freighter para habilitar las acciones.
              </p>
            )}

            {/* Transaction feedback */}
            {msg && (
              <div
                className={`tx-feedback ${msg.ok ? "success" : "error"}`}
                id="tx-feedback"
              >
                <p>{msg.text}</p>
                {msg.url && (
                  <a
                    className="explorer-link"
                    href={msg.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    🔍 Ver en Stellar Expert →
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Lotes Panel ── */}
        <section className="panel lotes-panel" id="lotes-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Lotes en subasta</h2>
              <p className="panel-desc">
                {lotes.length === 0
                  ? "Sin lotes registrados aún"
                  : `${lotes.length} lote${lotes.length > 1 ? "s" : ""} registrado${lotes.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              id="btn-refresh"
              className="btn-refresh"
              onClick={refrescar}
            >
              🔄 Actualizar
            </button>
          </div>

          <div className="lotes-list">
            {lotes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🐮</span>
                <p>Aún no hay lotes publicados.</p>
                <p className="empty-hint">
                  Cambia al rol de Empresa Agropecuaria y publica el primer lote.
                </p>
              </div>
            ) : (
              lotes.map((l) => <LoteCard key={l.id} lote={l} />)
            )}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <p>
          GanadoChain · Subasta descentralizada en{" "}
          <a href="https://stellar.org" target="_blank" rel="noreferrer">
            Stellar
          </a>{" "}
          · Comisión 0.25% · Smart Contract en{" "}
          <a href="https://soroban.stellar.org" target="_blank" rel="noreferrer">
            Soroban
          </a>
        </p>
      </footer>
    </main>
  );
}
