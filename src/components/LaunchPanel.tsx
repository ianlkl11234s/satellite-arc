/**
 * 發射時程面板
 *
 * 顯示即將發射的任務列表，包含倒數計時、火箭資訊、軌道參數等。
 * 點擊可飛到對應發射台位置。
 */

import { useEffect, useState } from "react";
import { Rocket, Clock, MapPin, Radio } from "lucide-react";
import type { Launch } from "../data/launchLoader";

const T = {
  FONT: "'Inter', sans-serif",
  BG: "#12161ECC",
  BORDER: "rgba(255,255,255,0.06)",
  ACCENT: "#5B9CF6",
  FG1: "#FFFFFF",
  FG2: "rgba(255,255,255,0.7)",
  FG3: "rgba(255,255,255,0.45)",
};

// 狀態色碼
const STATUS_COLORS: Record<string, string> = {
  Go: "#4caf50",
  TBD: "#ff9800",
  TBC: "#ffc107",
  Success: "#4caf50",
  Failure: "#f44336",
  "In Flight": "#2196f3",
  Hold: "#ff5722",
};

function formatCountdown(netStr: string): string {
  const diff = new Date(netStr).getTime() - Date.now();
  if (diff < 0) return "已過";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_COLORS[status] ?? "#666";
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: T.FONT,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 3,
        background: bg + "33",
        color: bg,
        border: `1px solid ${bg}55`,
      }}
    >
      {status}
    </span>
  );
}

interface LaunchPanelProps {
  launches: Launch[];
  onFlyTo?: (lat: number, lng: number, launch?: Launch) => void;
}

function LaunchCard({ l, now, onFlyTo, dimPast }: { l: Launch; now: number; onFlyTo?: (lat: number, lng: number, launch?: Launch) => void; dimPast: boolean }) {
  const isPast = l.net ? new Date(l.net).getTime() < now : false;

  return (
    <div
      key={l.id}
      onClick={() => {
        if (l.pad_latitude && l.pad_longitude && onFlyTo) {
          onFlyTo(l.pad_latitude, l.pad_longitude, l);
        }
      }}
      style={{
        fontFamily: T.FONT,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: l.pad_latitude ? "pointer" : "default",
        border: `1px solid ${T.BORDER}`,
        opacity: dimPast && isPast ? 0.5 : 1,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    >
      {/* 第一行：火箭 + 狀態 + 倒數 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Rocket size={12} color={T.FG2} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.FG1, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {l.rocket_name || l.name.split(" | ")[0]}
        </span>
        <StatusBadge status={l.status} />
        {l.net && !isPast && (
          <span style={{ fontSize: 10, color: T.ACCENT, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {formatCountdown(l.net)}
          </span>
        )}
      </div>

      {/* 第二行：任務名稱 */}
      <div style={{ fontSize: 11, color: T.FG2, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {l.mission_name || l.name.split(" | ")[1] || "—"}
      </div>

      {/* 第三行：時間 + 地點 + 軌道 */}
      <div style={{ display: "flex", gap: 10, fontSize: 10, color: T.FG3 }}>
        {l.net && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} />
            {new Date(l.net).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
              month: "numeric", day: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: false,
            })}
          </span>
        )}
        {l.location_name && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <MapPin size={9} />
            {l.location_name.split(",")[0]}
          </span>
        )}
        {l.orbit_abbrev && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Radio size={9} />
            {l.orbit_abbrev}
          </span>
        )}
      </div>

      {/* Live 標籤 */}
      {l.webcast_live && (
        <div style={{ marginTop: 4, fontSize: 9, color: "#f44336", fontWeight: 700, letterSpacing: 0.5 }}>
          ● LIVE
        </div>
      )}
    </div>
  );
}

export function LaunchPanel({ launches, onFlyTo }: LaunchPanelProps) {
  const [now, setNow] = useState(Date.now());

  // 每分鐘更新倒數計時
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (launches.length === 0) {
    return (
      <div style={{ fontFamily: T.FONT, fontSize: 12, color: T.FG3, padding: "12px 0" }}>
        尚無發射資料。請確認 Data Collector 已同步 Launch Library 2 資料。
      </div>
    );
  }

  const upcoming = launches.filter((l) => !l.net || new Date(l.net).getTime() >= now);
  const recent = launches.filter((l) => l.net && new Date(l.net).getTime() < now).reverse(); // 最新的在最前

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* 近期已發射 */}
      {recent.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: T.FG3, fontFamily: T.FONT, marginBottom: 4 }}>
            近期已發射 · {recent.length} 筆
          </div>
          {recent.slice(0, 10).map((l) => (
            <LaunchCard key={l.id} l={l} now={now} onFlyTo={onFlyTo} dimPast={true} />
          ))}
        </>
      )}

      {/* 即將發射 */}
      <div style={{ fontSize: 11, color: T.FG3, fontFamily: T.FONT, marginTop: recent.length > 0 ? 12 : 0, marginBottom: 4 }}>
        即將發射 · {upcoming.length} 筆
      </div>
      {upcoming.slice(0, 20).map((l) => (
        <LaunchCard key={l.id} l={l} now={now} onFlyTo={onFlyTo} dimPast={false} />
      ))}
    </div>
  );
}
