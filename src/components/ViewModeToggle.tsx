/**
 * 地球 / 太陽系模式切換按鈕
 */

import { Globe, Sun } from "lucide-react";

export type ViewMode = "earth" | "solar";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const FONT = "'Inter', sans-serif";

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div style={{
      display: "flex",
      height: 32,
      borderRadius: 10,
      background: "#12161ECC",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
      fontFamily: FONT,
    }}>
      <button
        onClick={() => onChange("earth")}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          height: "100%", padding: "0 12px", border: "none",
          background: mode === "earth" ? "rgba(91,156,246,0.15)" : "transparent",
          color: mode === "earth" ? "#5B9CF6" : "rgba(255,255,255,0.4)",
          cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: FONT,
          transition: "all 0.2s",
        }}
      >
        <Globe size={13} />
        Earth
      </button>
      <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
      <button
        onClick={() => onChange("solar")}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          height: "100%", padding: "0 12px", border: "none",
          background: mode === "solar" ? "rgba(91,156,246,0.15)" : "transparent",
          color: mode === "solar" ? "#5B9CF6" : "rgba(255,255,255,0.4)",
          cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: FONT,
          transition: "all 0.2s",
        }}
      >
        <Sun size={13} />
        Solar System
      </button>
    </div>
  );
}
