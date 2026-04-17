/**
 * 軌道面調整 Infographic — 重新設計
 *
 * 上半：放大示意的軌道面角度差（誇張化以看清楚）
 * 下半：緯度覆蓋帶 — 標示城市，讓觀眾直覺知道影響範圍
 */

import { useEffect, useRef } from "react";

const W = 380;
const H = 360;
const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

interface Props {
  prevInclination: number;
  currInclination: number;
  count: number;
}

const CITIES: { name: string; lat: number }[] = [
  { name: "新加坡", lat: 1 },
  { name: "台北", lat: 25 },
  { name: "東京", lat: 36 },
  { name: "首爾", lat: 37 },
  { name: "倫敦", lat: 51 },
  { name: "基輔", lat: 50 },
  { name: "紐約", lat: 41 },
  { name: "莫斯科", lat: 56 },
];

export function OrbitPlaneShift({ prevInclination, currInclination, count }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    // ── 上半：軌道面示意圖（角度放大 300x）──
    const topH = 170;
    const cx = W / 2;
    const cy = 85;
    const rEarth = 38;
    const rOrbit = 72;

    // 放大角度差讓視覺可見
    const exaggeration = 300;
    const delta = currInclination - prevInclination;
    const prevAngleVis = 50; // 基準視覺角度
    const currAngleVis = prevAngleVis + delta * exaggeration;

    // 地球
    const earthGrad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, rEarth);
    earthGrad.addColorStop(0, "#1e4a6e");
    earthGrad.addColorStop(1, "#0c1a2e");
    ctx.beginPath();
    ctx.arc(cx, cy, rEarth, 0, Math.PI * 2);
    ctx.fillStyle = earthGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(91,156,246,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 赤道
    ctx.beginPath();
    ctx.ellipse(cx, cy, rEarth, 6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 舊軌道面（紅色虛線）
    const prevRad = -(prevAngleVis * Math.PI) / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(prevRad);
    ctx.beginPath();
    ctx.ellipse(0, 0, rOrbit, rOrbit * 0.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#FF6B6B";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 新軌道面（青色實線）
    const currRad = -(currAngleVis * Math.PI) / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currRad);
    ctx.beginPath();
    ctx.ellipse(0, 0, rOrbit, rOrbit * 0.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 角度差弧線
    ctx.beginPath();
    ctx.arc(cx, cy, rOrbit + 14, prevRad - Math.PI / 2, currRad - Math.PI / 2, delta < 0);
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 箭頭
    const arrowRad = currRad - Math.PI / 2;
    const arrowX = cx + (rOrbit + 14) * Math.cos(arrowRad);
    const arrowY = cy + (rOrbit + 14) * Math.sin(arrowRad);
    ctx.beginPath();
    ctx.arc(arrowX, arrowY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9800";
    ctx.fill();

    // 圖例
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "left";
    // Before
    ctx.fillStyle = "#FF6B6B";
    ctx.fillText("── ", 16, topH - 30);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`調整前 ${prevInclination.toFixed(2)}°`, 40, topH - 30);
    // After
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillStyle = "#4FC3F7";
    ctx.fillText("── ", 16, topH - 12);
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`調整後 ${currInclination.toFixed(2)}°`, 40, topH - 12);

    // 放大提示
    ctx.font = "9px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "right";
    ctx.fillText("角度差已放大示意", W - 16, topH - 12);

    // Delta 標示
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "#ff9800";
    ctx.textAlign = "center";
    ctx.fillText(`Δ ${Math.abs(delta).toFixed(2)}°`, cx + rOrbit + 35, cy - 15);

    // ── 下半：緯度覆蓋帶 ──
    const bandY = topH + 20;
    const bandLeft = 50;
    const bandRight = W - 20;
    const bandW = bandRight - bandLeft;

    // 標題
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.fillText("覆蓋緯度帶", bandLeft, bandY);
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(`傾角 ${currInclination.toFixed(0)}° = 可達南北緯 ${currInclination.toFixed(0)}°`, bandLeft + 80, bandY);

    // 緯度軸
    const axisY = bandY + 50;
    const latToX = (lat: number) => bandLeft + ((lat + 90) / 180) * bandW;

    // 覆蓋帶背景
    const covLeft = latToX(-currInclination);
    const covRight = latToX(currInclination);
    const covGrad = ctx.createLinearGradient(covLeft, 0, covRight, 0);
    covGrad.addColorStop(0, "#4FC3F700");
    covGrad.addColorStop(0.15, "#4FC3F722");
    covGrad.addColorStop(0.5, "#4FC3F733");
    covGrad.addColorStop(0.85, "#4FC3F722");
    covGrad.addColorStop(1, "#4FC3F700");
    ctx.fillStyle = covGrad;
    ctx.fillRect(covLeft, axisY - 22, covRight - covLeft, 44);

    // 覆蓋帶邊界
    ctx.beginPath();
    ctx.moveTo(covLeft, axisY - 22);
    ctx.lineTo(covLeft, axisY + 22);
    ctx.strokeStyle = "#4FC3F766";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(covRight, axisY - 22);
    ctx.lineTo(covRight, axisY + 22);
    ctx.stroke();
    ctx.setLineDash([]);

    // 緯度軸線
    ctx.beginPath();
    ctx.moveTo(bandLeft, axisY);
    ctx.lineTo(bandRight, axisY);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 緯度刻度
    for (const lat of [-90, -60, -30, 0, 30, 60, 90]) {
      const x = latToX(lat);
      ctx.beginPath();
      ctx.moveTo(x, axisY - 3);
      ctx.lineTo(x, axisY + 3);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.stroke();

      ctx.font = "9px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.fillText(`${lat}°`, x, axisY + 14);
    }

    // 城市標記
    for (const city of CITIES) {
      const x = latToX(city.lat);
      const inRange = Math.abs(city.lat) <= currInclination;

      ctx.beginPath();
      ctx.arc(x, axisY, 3, 0, Math.PI * 2);
      ctx.fillStyle = inRange ? "#4FC3F7" : "rgba(255,255,255,0.2)";
      ctx.fill();

      ctx.font = `${inRange ? "bold " : ""}9px Inter, sans-serif`;
      ctx.fillStyle = inRange ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)";
      ctx.textAlign = "center";
      ctx.fillText(city.name, x, axisY - 8);
    }

    // 底部統計
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(`${count} 顆衛星正在優化此覆蓋帶的密度`, W / 2, H - 12);

  }, [prevInclination, currInclination, count]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H, borderRadius: 8, marginTop: 12 }}
    />
  );
}
