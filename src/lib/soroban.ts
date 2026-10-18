// =====================================================
// Punto de entrada ÚNICO para el servicio Soroban.
// Las pantallas importan solo de "@/lib/soroban".
//
// Mientras no hay contrato desplegado: "./soroban.mock"
// Cuando el contrato esté listo:      "./soroban.real"
// =====================================================
export * from "./soroban.mock";
