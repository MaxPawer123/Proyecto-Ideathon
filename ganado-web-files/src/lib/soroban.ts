// Punto de entrada ÚNICO. Las pantallas importan solo de "@/lib/soroban".
// Mientras no hay contrato:  "./soroban.mock"
// Cuando llegue ganado-client: cambiar a "./soroban.real"
export * from "./soroban.mock";
