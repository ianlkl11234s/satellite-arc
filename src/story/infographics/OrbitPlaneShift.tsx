/**
 * 軌道面調整 Infographic
 *
 * 地球側視圖：兩個傾斜的軌道橢圓，紅色=舊軌道面、青色=新軌道面。
 * 標示傾角變化和覆蓋緯度帶。
 */

import { useEffect, useRef } from "react";

const W = 380;
const H = 280;
const CX = W / 2;
const CY = H / 2 + 10;
const R_EARTH = 55;
const R_ORBIT = 110;

interface Props {
  prevInclination: number; // e.g. 52.8
  currInclination: number; // e.g. 53.0
  count: number; // 衛星數
}

export function OrbitPlaneShift({ prevInclination, currInclination, count }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    // 地球
    const earthGrad = ctx.createRadialGradient(CX - 10, CY - 10, 5, CX, CY, R_EARTH);
    earthGrad.addColorStop(0, "#1a3a5c");
    earthGrad.addColorStop(1, "#0a1628");
    ctx.beginPath();
    ctx.arc(CX, CY, R_EARTH, 0, Math.PI * 2);
    ctx.fillStyle = earthGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(91,156,246,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 赤道線
    ctx.beginPath();
    ctx.ellipse(CX, CY, R_EARTH, R_EARTH * 0.15, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 繪製傾斜軌道橢圓
    function drawOrbit(inclDeg: number, color: string, label: string, dashPattern: number[]) {
      const incRad = (inclDeg * Math.PI) / 180;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(-incRad);

      ctx.beginPath();
      ctx.ellipse(0, 0, R_ORBIT, R_ORBIT * 0.25, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashPattern);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // 標籤
      const labelX = CX + R_ORBIT * Math.cos(-incRad) + 8;
      const labelY = CY + R_ORBIT * Math.sin(-incRad) * 0.25 - 8;
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(label, Math.min(labelX, W - 80), Math.max(labelY, 20));
    }

    // 舊軌道（紅色虛線）
    drawOrbit(prevInclination, "#FF6B6B", `Before: ${prevInclination.toFixed(1)}°`, [4, 4]);

    // 新軌道（青色實線）
    drawOrbit(currInclination, "#4FC3F7", `After: ${currInclination.toFixed(1)}°`, []);

    // 角度差標示弧線
    const delta = Math.abs(currInclination - prevInclination);
    if (delta > 0.001) {
      const startRad = -(prevInclination * Math.PI) / 180;
      const endRad = -(currInclination * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(CX, CY, R_ORBIT + 15, startRad, endRad, currInclination > prevInclination);
      ctx.strokeStyle = "#ff9800";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Delta 標籤
      const midRad = (startRad + endRad) / 2;
      const lx = CX + (R_ORBIT + 28) * Math.cos(midRad);
      const ly = CY + (R_ORBIT + 28) * Math.sin(midRad);
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillStyle = "#ff9800";
      ctx.textAlign = "center";
      ctx.fillText(`Δ ${delta.toFixed(2)}°`, lx, ly);
    }

    // 說明文字
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(`${count} 顆衛星調整了軌道面傾角`, CX, H - 12);

    // 覆蓋緯度帶標示
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textAlign = "left";
    ctx.fillText(`覆蓋 ±${currInclination.toFixed(0)}° 緯度`, 12, H - 12);

  }, [prevInclination, currInclination, count]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H, borderRadius: 8, marginTop: 12 }}
    />
  );
}
