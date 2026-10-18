"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { conectarAlbedo, getAlbedoIntentUrl } from "@/services/albedoService";

interface AlbedoConnectProps {
  onAddressChange?: (address: string) => void;
  currentAddress?: string;
}

export default function AlbedoConnect({
  onAddressChange,
  currentAddress = "",
}: AlbedoConnectProps) {
  const [address, setAddress] = useState<string>(currentAddress);
  const [loading, setLoading] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const qrIntentUrl = getAlbedoIntentUrl("testnet");

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const pubkey = await conectarAlbedo();
      setAddress(pubkey);
      if (onAddressChange) {
        onAddressChange(pubkey);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con Albedo";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress("");
    if (onAddressChange) {
      onAddressChange("");
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "8px", position: "relative" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        {address ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "10px",
              padding: "6px 14px",
              color: "#4ade80",
              fontWeight: 600,
              fontSize: "0.88rem",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🟢</span>
            <span>{formatAddress(address)}</span>
            <button
              onClick={handleDisconnect}
              title="Desconectar"
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "0.85rem",
                marginLeft: "4px",
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              color: "#0f172a",
              border: "none",
              borderRadius: "10px",
              padding: "9px 18px",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>⏳ Conectando Albedo…</>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Conectar con Albedo
              </>
            )}
          </button>
        )}

        {/* Botón para ver QR en celular */}
        <button
          onClick={() => setShowQR(!showQR)}
          title="Conectar escaneando desde el celular"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            color: "#e2e8f0",
            borderRadius: "10px",
            padding: "9px 12px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            transition: "all 0.2s ease",
          }}
        >
          📱 QR
        </button>
      </div>

      {/* Alerta de error */}
      {errorMsg && (
        <span style={{ color: "#ef4444", fontSize: "0.8rem", maxWidth: "260px" }}>
          ⚠️ {errorMsg}
        </span>
      )}

      {/* Modal / Popover con Código QR */}
      {showQR && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            zIndex: 100,
            background: "#0f172a",
            border: "1px solid rgba(14, 165, 233, 0.35)",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            width: "220px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}>
              Albedo Testnet (Móvil)
            </span>
            <button
              onClick={() => setShowQR(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <QRCodeSVG value={qrIntentUrl} size={150} level="M" />
          </div>

          <p style={{ fontSize: "0.74rem", color: "#94a3b8", textAlign: "center", margin: 0 }}>
            Escanea con tu cámara o abre el enlace en tu celular para autorizar en Testnet.
          </p>

          <a
            href={qrIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.75rem",
              color: "#38bdf8",
              textDecoration: "underline",
            }}
          >
            Abrir Albedo Web ↗
          </a>
        </div>
      )}
    </div>
  );
}
