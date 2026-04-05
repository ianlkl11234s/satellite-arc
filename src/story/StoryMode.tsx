/**
 * 互動式簡報模式 — Scrollytelling
 *
 * 左側地球（sticky），右側滾動文字面板。
 * 滾動時地球自動旋轉、篩選衛星、顯示軌道。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView, type CameraPreset } from "../globe/GlobeView";
import type { SatelliteTLE } from "../data/satelliteLoader";
import { loadSatelliteTLEs, computeOrbitPath, splitAtDateline } from "../data/satelliteLoader";
import { loadSatelliteManeuvers, type SatelliteManeuver } from "../data/maneuverLoader";
import type { ComparisonOrbitPair } from "../globe/ComparisonOrbits";
import type { StoryChapter } from "./chapters";
import { STARLINK_STORY_0404 } from "./chapters";
import * as satellite from "satellite.js";

const FONT = "'Inter', sans-serif";

export function StoryMode({ onExit }: { onExit: () => void }) {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [maneuvers, setManeuvers] = useState<SatelliteManeuver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const simTimeRef = useRef(Date.now() / 1000);
  const speedRef = useRef(60);

  const chapters = STARLINK_STORY_0404;
  const chapter = chapters[activeChapter]!;

  // 載入資料
  useEffect(() => {
    Promise.all([loadSatelliteTLEs(), loadSatelliteManeuvers()])
      .then(([t, m]) => { setTles(t); setManeuvers(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // 時間推進
  useEffect(() => {
    let running = true;
    let lastReal = Date.now();
    const tick = () => {
      if (!running) return;
      const now = Date.now();
      const dt = Math.min((now - lastReal) / 1000, 1);
      simTimeRef.current += dt * speedRef.current;
      lastReal = now;
      requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; };
  }, []);

  // 同步速度
  useEffect(() => {
    speedRef.current = chapter.speed ?? 60;
  }, [chapter.speed]);

  const getCurrentTime = useCallback(() => simTimeRef.current, []);

  // Scroll observer — 偵測哪個章節在視窗中
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = chapterRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveChapter(idx);
          }
        }
      },
      { threshold: 0.5 },
    );

    for (const ref of chapterRefs.current) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [loading]);

  // 篩選衛星
  const visibleCategories = useMemo(() => {
    if (chapter.categories) return new Set(chapter.categories);
    return new Set(["starlink", "broadband", "phone", "geo_comms", "navigation", "earth_obs", "science", "military", "tech_demo", "other"]);
  }, [chapter.categories]);

  const visibleConstellations = useMemo(() => {
    if (chapter.constellations) return new Set(chapter.constellations);
    return new Set(tles.map((t) => t.constellation || "Other"));
  }, [chapter.constellations, tles]);

  // 分析模式過濾
  const noradIdFilter = useMemo(() => {
    if (!chapter.maneuverFilter) return null;
    const filtered = maneuvers.filter((m) => m.maneuver_type === chapter.maneuverFilter);
    if (filtered.length === 0) return null;
    return new Set(filtered.map((m) => m.norad_id));
  }, [chapter.maneuverFilter, maneuvers]);

  const highlightedIds = useMemo(() => {
    if (!noradIdFilter) return null;
    return new Set([...noradIdFilter].map((id) => `sat_${id}`));
  }, [noradIdFilter]);

  const highlightColors = useMemo(() => {
    if (!highlightedIds || !chapter.accentColor) return null;
    const map = new Map<string, string>();
    for (const id of highlightedIds) map.set(id, chapter.accentColor);
    return map;
  }, [highlightedIds, chapter.accentColor]);

  // 群體軌道
  const comparisonOrbits = useMemo(() => {
    if (!chapter.showOrbits || !chapter.maneuverFilter) return null;
    const filtered = maneuvers.filter((m) => m.maneuver_type === chapter.maneuverFilter);
    const now = new Date();
    const pairs: ComparisonOrbitPair[] = [];
    for (const m of filtered) {
      const tle = tles.find((t) => t.norad_id === m.norad_id);
      if (!tle) continue;
      try {
        const satrec = satellite.twoline2satrec(tle.tle_line1, tle.tle_line2);
        const path = computeOrbitPath(satrec, now, 90, 30);
        const segments = splitAtDateline(path);
        const longest = segments.length > 0 ? segments.reduce((a, b) => a.length > b.length ? a : b) : path;
        if (longest.length >= 2) {
          pairs.push({ before: null, after: longest, color: chapter.accentColor });
        }
      } catch { continue; }
    }
    return pairs.length > 0 ? pairs : null;
  }, [chapter.showOrbits, chapter.maneuverFilter, chapter.accentColor, maneuvers, tles]);

  // 軌道弧線（簡化版，不做完整的 Flight 轉換）
  const orbits = useMemo(() => [] as Array<{ path: [number, number, number, number][]; orbitType: string }>, []);

  if (loading) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#020208", color: "#5B9CF6", fontFamily: FONT, fontSize: 16,
      }}>
        載入故事資料中...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* 地球 — sticky 固定 */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <GlobeView
          tles={tles}
          orbits={orbits}
          getCurrentTime={getCurrentTime}
          visibleOrbitTypes={visibleCategories}
          showTrails={true}
          showOrbits={false}
          orbitOpacity={0.35}
          orbScale={0.6}
          orbOpacity={0.8}
          trailLength={20}
          colors={{}}
          visibleConstellations={visibleConstellations}
          visibleCountries={new Set()}
          selectedId={null}
          noradIdFilter={noradIdFilter}
          highlightedIds={highlightedIds}
          highlightColors={highlightColors}
          comparisonOrbits={comparisonOrbits}
        />
      </div>

      {/* 返回按鈕 */}
      <button
        onClick={onExit}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 30,
          fontFamily: FONT, fontSize: 12, fontWeight: 500,
          padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          background: "rgba(18,22,30,0.8)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        ← 返回主畫面
      </button>

      {/* 章節進度指示 */}
      <div style={{
        position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)",
        zIndex: 30, display: "flex", flexDirection: "column", gap: 8,
      }}>
        {chapters.map((ch, i) => (
          <div
            key={ch.id}
            onClick={() => chapterRefs.current[i]?.scrollIntoView({ behavior: "smooth" })}
            style={{
              width: 8, height: 8, borderRadius: "50%", cursor: "pointer",
              background: i === activeChapter ? (ch.accentColor ?? "#5B9CF6") : "rgba(255,255,255,0.2)",
              transition: "all 0.3s",
              transform: i === activeChapter ? "scale(1.5)" : "scale(1)",
            }}
            title={ch.title}
          />
        ))}
      </div>

      {/* 滾動文字面板 */}
      <div style={{
        position: "relative", zIndex: 10,
        pointerEvents: "none",
      }}>
        {chapters.map((ch, i) => (
          <div
            key={ch.id}
            ref={(el) => { chapterRefs.current[i] = el; }}
            style={{
              minHeight: "100vh",
              display: "flex", alignItems: "center",
              padding: "0 5vw",
              pointerEvents: "auto",
            }}
          >
            <div style={{
              maxWidth: 420,
              padding: "28px 32px",
              borderRadius: 16,
              background: "rgba(12,16,24,0.85)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${i === activeChapter ? (ch.accentColor ?? "#5B9CF6") + "44" : "rgba(255,255,255,0.06)"}`,
              opacity: i === activeChapter ? 1 : 0.3,
              transition: "opacity 0.5s, border-color 0.5s",
              fontFamily: FONT,
            }}>
              {/* 章節編號 */}
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: ch.accentColor ?? "#5B9CF6",
                marginBottom: 8, textTransform: "uppercase",
              }}>
                {String(i + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
              </div>

              {/* 標題 */}
              <h2 style={{
                fontSize: 22, fontWeight: 700, color: "#FFFFFF",
                margin: "0 0 4px", lineHeight: 1.3,
              }}>
                {ch.title}
              </h2>

              {/* 副標題 */}
              {ch.subtitle && (
                <div style={{
                  fontSize: 13, color: ch.accentColor ?? "#5B9CF6",
                  fontWeight: 500, marginBottom: 12,
                }}>
                  {ch.subtitle}
                </div>
              )}

              {/* 內文 */}
              <p style={{
                fontSize: 14, lineHeight: 1.8,
                color: "rgba(255,255,255,0.75)",
                margin: 0, whiteSpace: "pre-line",
              }}>
                {ch.body}
              </p>

              {/* 軌道指標 */}
              {ch.showOrbits && (
                <div style={{
                  marginTop: 12, padding: "6px 10px", borderRadius: 6,
                  background: (ch.accentColor ?? "#5B9CF6") + "15",
                  fontSize: 11, color: ch.accentColor ?? "#5B9CF6",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ width: 20, height: 2, background: ch.accentColor ?? "#5B9CF6", borderRadius: 1 }} />
                  軌道線已顯示於地球上
                  {ch.speed && ch.speed > 60 && ` · ${ch.speed}x 加速中`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
