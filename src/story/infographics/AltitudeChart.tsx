/**
 * 協調爬升/降軌 Infographic
 *
 * Y 軸 = 高度 (km)，X 軸 = 衛星排列。
 * 動畫展示衛星從起始高度移動到目標高度。
 * mode="ascent" 爬升（向上），mode="deorbit" 降軌（向下）。
 */

import { useEffect, useRef, useState } from "react";

const W = 380;
const H = 240;
const PAD = { top: 30, right: 20, bottom: 35, left: 55 };

interface SatDot {
  name: string;
  fromAlt: number; // km
  toAlt: number;   // km
}

interface Props {
  satellites: SatDot[];
  mode: "ascent" | "deorbit";
  /** Y 軸範圍 [min, max] km */
  yRange?: [number, number];
  accentColor?: string;
}

export function AltitudeChart({ satellites, mode, yRange, accentColor = "#ff9800" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const animRef = useRef(0);

  // 動畫
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const duration = 2500; // 2.5s

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(ease);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [satellites, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const [yMin, yMax] = yRange ?? (mode === "ascent" ? [250, 600] : [0, 600]);
    const yScale = (alt: number) => PAD.top + plotH * (1 - (alt - yMin) / (yMax - yMin));
    const xScale = (i: number) => PAD.left + (plotW * (i + 0.5)) / Math.max(satellites.length, 1);

    // 背景格線
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const alt = yMin + ((yMax - yMin) * i) / yTicks;
      const y = yScale(alt);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();

      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(alt)}`, PAD.left - 8, y + 3);
    }

    // Y 軸標題
    ctx.save();
    ctx.translate(12, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("高度 (km)", 0, 0);
    ctx.restore();

    // 目標高度線
    if (mode === "ascent" && satellites.length > 0) {
      const targetAlt = satellites[0]!.toAlt;
      const ty = yScale(targetAlt);
      ctx.beginPath();
      ctx.moveTo(PAD.left, ty);
      ctx.lineTo(W - PAD.right, ty);
      ctx.strokeStyle = accentColor + "66";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = accentColor;
      ctx.textAlign = "left";
      ctx.fillText(`工作軌道 ~${Math.round(targetAlt)} km`, W - PAD.right - 120, ty - 6);
    }

    // 起始高度線
    if (satellites.length > 0) {
      const startAlt = satellites[0]!.fromAlt;
      const sy = yScale(startAlt);
      ctx.beginPath();
      ctx.moveTo(PAD.left, sy);
      ctx.lineTo(W - PAD.right, sy);
      ctx.strokeStyle = "#FF6B6B66";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = "#FF6B6B";
      ctx.textAlign = "left";
      const label = mode === "ascent" ? `部署軌道 ~${Math.round(startAlt)} km` : `當前軌道 ~${Math.round(startAlt)} km`;
      ctx.fillText(label, PAD.left + 4, sy - 6);
    }

    // 衛星點
    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i]!;
      const currAlt = sat.fromAlt + (sat.toAlt - sat.fromAlt) * progress;
      const x = xScale(i);
      const y = yScale(currAlt);

      // 軌跡線（from → current）
      ctx.beginPath();
      ctx.moveTo(x, yScale(sat.fromAlt));
      ctx.lineTo(x, y);
      ctx.strokeStyle = accentColor + "33";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 點
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // 光暈
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = accentColor + "22";
      ctx.fill();
    }

    // 底部說明
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    const desc = mode === "ascent"
      ? `${satellites.length} 顆衛星同步爬升中`
      : `${satellites.length} 顆衛星正在降軌`;
    ctx.fillText(desc, CX, H - 8);

  }, [satellites, mode, yRange, accentColor, progress]);

  const CX = W / 2;

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H, borderRadius: 8, marginTop: 12, cursor: "pointer" }}
      onClick={() => {
        // 重新播放動畫
        setProgress(0);
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / 2500, 1);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setProgress(ease);
          if (t < 1) animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      }}
      title="點擊重播動畫"
    />
  );
}
