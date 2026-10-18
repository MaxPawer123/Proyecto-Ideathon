"use client";
import { useCallback, useEffect, useState } from "react";
import { connectWallet, crearLote, verificarLote, pujar, liquidar, listarLotes } from "@/lib/soroban";
import { Lote, TxResult, corto } from "@/lib/types";
import { CONFIG, Rol } from "@/lib/config";
import LoteCard from "@/components/LoteCard";

const ROLES: { id: Rol; label: string }[] = [
  { id: "ganadero", label: "Empresa agropecuaria" },
  { id: "veterinario", label: "Veterinario" },
  { id: "comprador", label: "Comprador" },
];

const input = "w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm";
const btn =
  "rounded bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50";

export default function Home() {
  const [rol, setRol] = useState<Rol>("ganadero");
  const [addr, setAddr] = useState("");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);

  // formularios
  const [vetAddr, setVetAddr] = useState(CONFIG.addr.veterinario);
  const [cabezas, setCabezas] = useState(500);
  const [precio, setPrecio] = useState(100);
  const [loteId, setLoteId] = useState(1);
  const [libre, setLibre] = useState(true);
  const [score, setScore] = useState(5);
  const [notas, setNotas] = useState("SENASAG_SIN_PLAGAS_OK");
  const [monto, setMonto] = useState(120);

  const refrescar = useCallback(async () => {
    try { setLotes(await listarLotes()); } catch { /* sin contrato aún */ }
  }, []);
  useEffect(() => { refrescar(); }, [refrescar]);

  const esperada = CONFIG.addr[rol];
  const cuentaEquivocada = !!addr && !!esperada && addr !== esperada;

  const ejecutar = async (fn: () => Promise<TxResult>) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ ok: true, text: "Transacción confirmada", url: r.explorerUrl });
      await refrescar();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  };

  const sinWallet = !addr;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Remate de ganado verificado</h1>
          <p className="text-sm text-stone-600">Subasta en USDC sobre Stellar Testnet, comisión 0.25%</p>
        </div>
        <button
          className={btn}
          onClick={async () => {
            try { setAddr(await connectWallet()); }
            catch (e: any) { setMsg({ ok: false, text: e.message }); }
          }}
        >
          {addr ? `Conectado: ${corto(addr)}` : "Conectar Freighter"}
        </button>
      </header>

      <nav className="flex gap-2 border-b border-stone-300">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRol(r.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              rol === r.id ? "border-emerald-800 font-semibold" : "border-transparent text-stone-500"
            }`}
          >
            {r.label}
          </button>
        ))}
      </nav>

      {cuentaEquivocada && (
        <p className="rounded border border-amber-400 bg-amber-50 p-3 text-sm">
          Freighter tiene la cuenta {corto(addr)}, pero este rol usa {corto(esperada)}. Cambia de cuenta en
          Freighter y pulsa de nuevo &quot;Conectar Freighter&quot;.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-stone-300 bg-stone-50 p-4">
          {rol === "ganadero" && (
            <>
              <h2 className="font-semibold">Publicar lote</h2>
              <label className="block text-sm">Dirección del veterinario (G...)
                <input className={input} value={vetAddr} onChange={(e) => setVetAddr(e.target.value)} />
              </label>
              <label className="block text-sm">Cabezas de ganado
                <input className={input} type="number" min={1} value={cabezas} onChange={(e) => setCabezas(+e.target.value)} />
              </label>
              <label className="block text-sm">Precio base (USDC)
                <input className={input} type="number" min={1} value={precio} onChange={(e) => setPrecio(+e.target.value)} />
              </label>
              <button className={btn} disabled={busy || sinWallet || !vetAddr}
                onClick={() => ejecutar(() => crearLote(addr, vetAddr, cabezas, precio))}>
                {busy ? "Firmando…" : "Publicar lote"}
              </button>
            </>
          )}

          {rol === "veterinario" && (
            <>
              <h2 className="font-semibold">Certificar lote</h2>
              <label className="block text-sm">Número de lote
                <input className={input} type="number" min={1} value={loteId} onChange={(e) => setLoteId(+e.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={libre} onChange={(e) => setLibre(e.target.checked)} />
                Libre de plagas y garrapatas
              </label>
              <label className="block text-sm">Calificación (1 a 5)
                <input className={input} type="number" min={1} max={5} value={score} onChange={(e) => setScore(Math.min(5, Math.max(1, +e.target.value)))} />
              </label>
              <label className="block text-sm">Referencia del certificado
                <input className={input} value={notas} onChange={(e) => setNotas(e.target.value)} />
              </label>
              <button className={btn} disabled={busy || sinWallet}
                onClick={() => ejecutar(() => verificarLote(addr, loteId, libre, score, notas))}>
                {busy ? "Firmando…" : "Firmar certificado"}
              </button>
            </>
          )}

          {rol === "comprador" && (
            <>
              <h2 className="font-semibold">Pujar y pagar</h2>
              <label className="block text-sm">Número de lote
                <input className={input} type="number" min={1} value={loteId} onChange={(e) => setLoteId(+e.target.value)} />
              </label>
              <label className="block text-sm">Tu puja (USDC)
                <input className={input} type="number" min={1} value={monto} onChange={(e) => setMonto(+e.target.value)} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className={btn} disabled={busy || sinWallet}
                  onClick={() => ejecutar(() => pujar(addr, loteId, monto))}>
                  {busy ? "Firmando…" : "Pujar"}
                </button>
                <button className={btn} disabled={busy || sinWallet}
                  onClick={() => ejecutar(() => liquidar(addr, loteId))}>
                  {busy ? "Firmando…" : "Pagar lote ganado"}
                </button>
              </div>
            </>
          )}

          {sinWallet && <p className="text-xs text-stone-500">Conecta Freighter para habilitar los botones.</p>}

          {msg && (
            <p className={`break-all rounded p-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
              {msg.text}
              {msg.url && (
                <>
                  {" "}<a className="underline" href={msg.url} target="_blank" rel="noreferrer">Ver en Stellar Expert</a>
                </>
              )}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lotes</h2>
            <button className="text-sm underline" onClick={refrescar}>Actualizar</button>
          </div>
          {lotes.length === 0 && <p className="text-sm text-stone-500">Aún no hay lotes. Publica el primero con la cuenta de la empresa.</p>}
          {lotes.map((l) => <LoteCard key={l.id} lote={l} />)}
        </section>
      </div>
    </main>
  );
}
