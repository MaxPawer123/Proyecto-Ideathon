# Parte Web/UI: Remate de ganado verificado (Stellar/Soroban)

## 1. Crear el proyecto base (una sola vez)
```bash
npx create-next-app@latest ganado-web --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
cd ganado-web
npm install @stellar/freighter-api @stellar/stellar-sdk
```

## 2. Copiar estos archivos dentro de ganado-web/
- `src/lib/*`  (config, types, soroban, soroban.mock, soroban.real)
- `src/components/LoteCard.tsx`
- `src/app/page.tsx`  (reemplaza el existente)
- `.env.local.example` -> renombrar a `.env.local`

Con `npm run dev` ya funciona con datos simulados (mock), sin esperar al contrato.

## 3. Freighter (navegador)
1. Instalar la extensión (freighter.app) y poner la red en **Testnet**.
2. Importar las 3 secret keys que te pasa el compañero: Add account > Import a Stellar secret key.
   Nombrar: Ganadero, Veterinario, Comprador.
3. Para cambiar de rol en la web: cambiar la cuenta activa en Freighter y pulsar "Conectar Freighter".

## 4. Pasar a modo real (cuando llegue el contrato)
1. Copiar la carpeta `ganado-client/` (bindings) a la raíz de `ganado-web/`, y correr:
   ```bash
   cd ganado-client && npm install && npm run build && cd ..
   npm install ./ganado-client
   ```
   Revisar el "name" en `ganado-client/package.json`; si no es `ganado-client`, cambiar el import en `soroban.real.ts`.
2. Completar `.env.local` con `NEXT_PUBLIC_CONTRACT_ID` (C...) y las 3 direcciones públicas (G...).
3. En `src/lib/soroban.ts` cambiar la línea a: `export * from "./soroban.real";`
4. En `tsconfig.json` verificar `"target": "ES2020"` o superior (por BigInt).

## 5. Flujo de la demo
1. Ganadero: publicar lote (poner la dirección G... del veterinario).
2. Veterinario: firmar certificado del lote 1.
3. Comprador: pujar (mayor al precio base) y luego "Pagar lote ganado".
4. Abrir el enlace a Stellar Expert para mostrar la división 0.25% / 99.75%.

## Errores comunes
- Freighter no abre: red en Mainnet. Cambiar a Testnet.
- "Account not found": cuenta sin fondear (usar `--fund` o Friendbot).
- Error de autorización: la cuenta activa en Freighter no corresponde al rol.
- No resuelve `ganado-client`: falta `npm run build` dentro de esa carpeta o el nombre del paquete es otro.
