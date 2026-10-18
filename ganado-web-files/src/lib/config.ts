export type Rol = "ganadero" | "veterinario" | "comprador";

export const CONFIG = {
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? "",
  addr: {
    ganadero: process.env.NEXT_PUBLIC_GANADERO_ADDR ?? "",
    veterinario: process.env.NEXT_PUBLIC_VETERINARIO_ADDR ?? "",
    comprador: process.env.NEXT_PUBLIC_COMPRADOR_ADDR ?? "",
  } as Record<Rol, string>,
};
