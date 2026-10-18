// =====================================================
// GanadoChain — Configuración de Stellar / Soroban
// =====================================================

/** 
 * ⚠️ ACTUALIZA CONTRACT_ID cuando tu compañero termine el deploy en Testnet.
 * El ID lo encuentras en el output del comando:
 *   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/ganado_chain.wasm --network testnet
 */
export const STELLAR_CONFIG = {
  // Red
  NETWORK: 'TESTNET' as const,
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  
  // Endpoints
  SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  FRIENDBOT_URL: 'https://friendbot.stellar.org',
  
  // Contrato — ¡REEMPLAZAR con el ID real del deploy!
  CONTRACT_ID: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU45ZCBD3',
  
  // USDC Testnet asset (ejemplo — ajustar al token que usen)
  USDC_CONTRACT_ID: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  
  // Comisión de la plataforma
  COMMISSION_RATE: 0.0025, // 0.25%
  
  // Timeouts
  TX_TIMEOUT_SEC: 30,
} as const;

export type StellarNetwork = typeof STELLAR_CONFIG.NETWORK;
