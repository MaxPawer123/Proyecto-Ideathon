import { Lote, calcularComision, corto } from "@/lib/types";

export default function LoteCard({ lote }: { lote: Lote }) {
  const { fee, vendedor } = calcularComision(lote.highestBid);
  const estado = lote.isSettled
    ? { t: "Pagado", c: "bg-stone-800 text-white" }
    : lote.isVerified && lote.pestFree
    ? { t: "Verificado: en subasta", c: "bg-emerald-700 text-white" }
    : lote.isVerified
    ? { t: "Rechazado por plagas", c: "bg-red-700 text-white" }
    : { t: "Esperando veterinario", c: "bg-amber-200 text-amber-900" };

  return (
    <article className="rounded-lg border border-stone-300 bg-white p-4">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">Lote #{lote.id}: {lote.headCount.toLocaleString()} cabezas</h3>
        <span className={`rounded px-2 py-1 text-xs font-medium ${estado.c}`}>{estado.t}</span>
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-stone-500">Ganadero</dt><dd>{corto(lote.seller)}</dd>
        <dt className="text-stone-500">Veterinario</dt><dd>{corto(lote.vet)}</dd>
        <dt className="text-stone-500">Calificación</dt>
        <dd>{lote.isVerified ? "★".repeat(lote.vetScore) + "☆".repeat(5 - lote.vetScore) : "Sin calificar"}</dd>
        <dt className="text-stone-500">Certificado</dt><dd className="break-all">{lote.vetNotes}</dd>
        <dt className="text-stone-500">Precio base</dt><dd>{lote.basePrice.toLocaleString()} USDC</dd>
        <dt className="text-stone-500">Mejor puja</dt>
        <dd className="font-semibold">{lote.highestBid.toLocaleString()} USDC ({corto(lote.highestBidder)})</dd>
      </dl>

      <div className="mt-3 rounded bg-stone-100 p-3 text-sm">
        <p className="font-medium">Desglose del pago</p>
        <p>Comisión de la plataforma (0.25%): <b>{fee.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC</b></p>
        <p>Pago al ganadero (99.75%): <b>{vendedor.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC</b></p>
      </div>

      {lote.isVerified && lote.pestFree && (
        <p className="mt-3 rounded border-2 border-emerald-700 p-2 text-center text-sm font-bold text-emerald-800">
          VERIFICADO ON-CHAIN EN STELLAR
        </p>
      )}
    </article>
  );
}
