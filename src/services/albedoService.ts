import albedo from "@albedo-link/intent";

// ============================================================================
// CONFIGURACIÓN DE ALBEDO PARA STELLAR TESTNET
// ============================================================================

export const ALBEDO_NETWORK = "testnet";

export interface AlbedoAuthResponse {
  pubkey: string;
  signature?: string;
  signed_message?: string;
}

export interface AlbedoTxResponse {
  txHash: string;
  signedEnvelopeXdr: string;
  explorerUrl: string;
}

/**
 * 1. Conectar billetera mediante Albedo (Abre popup web).
 * No requiere extensión de navegador, ideal para evitar restricciones geográficas.
 */
export async function conectarAlbedo(): Promise<string> {
  try {
    const res = await albedo.publicKey({
      require_existing: false,
    });

    if (!res || !res.pubkey) {
      throw new Error("No se pudo obtener la dirección pública desde Albedo.");
    }

    return res.pubkey;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Conexión con Albedo cancelada o fallida";
    console.error("[conectarAlbedo]", msg);
    throw new Error(msg);
  }
}

/**
 * 2. Firmar y transmitir una transacción XDR usando Albedo en Testnet.
 */
export async function firmarTransaccionAlbedo(xdr: string): Promise<AlbedoTxResponse> {
  try {
    const res = await albedo.tx({
      xdr,
      network: ALBEDO_NETWORK,
      submit: true, // Albedo envía directamente la tx a Horizon/Soroban
    });

    const hash = res.tx_hash || "";
    return {
      txHash: hash,
      signedEnvelopeXdr: res.signed_envelope_xdr,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Firma rechazada en Albedo";
    console.error("[firmarTransaccionAlbedo]", msg);
    throw new Error(msg);
  }
}

/**
 * 3. Genera la URL del intent web de Albedo para conexión desde el celular.
 * Esta URL se utiliza para generar el código QR.
 */
export function getAlbedoIntentUrl(network: "testnet" | "public" = "testnet"): string {
  // Enlace directo al intent de autenticación de Albedo
  return `https://albedo.link/confirm?intent=public_key&network=${network}`;
}
