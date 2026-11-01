"use client";

import { useEffect, useRef, useState } from "react";
import { kfmt, money } from "@/lib/format";

type Series = { name: string; values: number[]; color: string; kind?: "bar" | "line"; dashed?: boolean; area?: boolean };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

type ChartProps = {
  labels: string[];
  series: Series[];
  height?: number;
  label: string;
  /** "zero" starts the axis at 0; "auto" fits the range. */
  base?: "zero" | "auto";
  fmt?: (n: number) => string;
  yfmt?: (n: number) => string;
};

/** Bars and/or lines on one scale, with a hover tooltip and a faint grid. */
export function Chart({ labels, series, height = 240, label, base = "zero", fmt = (n) => money(n), yfmt = kfmt }: ChartProps) {
  const [ref, W] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const L = 52, R = 12, T = 12, B = 26;
  const iw = Math.max(10, W - L - R), ih = height - T - B, n = labels.length;
  const all = series.flatMap((s) => s.values);
  let min = 0, max = niceMax(Math.max(...all) * 1.04);
  if (base === "auto") {
    const lo = Math.min(...all), hi = Math.max(...all);
    const step = niceMax((hi - lo) / 3 || 1);
    min = Math.floor(lo / step) * step - step * 0.5;
    min = Math.max(0, Math.floor(min / step) * step);
    max = Math.ceil(hi / step) * step;
    if (max === min) max = min + step;
  }
  const bars = series.filter((s) => (s.kind ?? "bar") === "bar");
  const band = iw / n;
  const x = (i: number) => (bars.length ? L + band * i + band / 2 : L + (n === 1 ? iw / 2 : (i * iw) / (n - 1)));
  const y = (v: number) => T + ih - ((v - min) / (max - min)) * ih;
  const bw = Math.max(3, Math.min(18, (band * 0.72) / Math.max(1, bars.length)));
  const step = Math.max(1, Math.ceil((n * 46) / Math.max(iw, 1)));
  return (
    <div ref={ref} className="chart" style={{ height }} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
      {W > 0 && (
        <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} aria-hidden>
          {[0, 1, 2, 3, 4].map((k) => {
            const v = min + ((max - min) * k) / 4;
            return (
              <g key={k}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#ededed" />
                <text x={L - 8} y={y(v) + 4} textAnchor="end">{yfmt(v)}</text>
              </g>
            );
          })}
          {labels.map((l, i) => ((n - 1 - i) % step === 0 ? <text key={l + i} x={x(i)} y={height - 6} textAnchor="middle">{l}</text> : null))}
          {bars.map((s, j) =>
            s.values.map((v, i) => {
              const bx = x(i) - (bars.length * bw) / 2 + j * bw;
              return <rect key={s.name + i} x={bx + 0.5} y={y(v)} width={bw - 1} height={Math.max(0, T + ih - y(v))} rx={2} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.45} />;
            })
          )}
          {series.filter((s) => s.kind === "line").map((s) => {
            const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
            return (
              <g key={s.name}>
                {s.area && <polygon points={`${x(0)},${T + ih} ${pts} ${x(n - 1)},${T + ih}`} fill={s.color} opacity={0.07} />}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} strokeLinejoin="round" />
                <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={3.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              </g>
            );
          })}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={T + ih} stroke="#bdbdb8" strokeDasharray="3 3" />}
          {labels.map((_, i) => (
            <rect key={"h" + i} x={bars.length ? L + band * i : x(i) - iw / Math.max(1, n - 1) / 2} y={T} width={bars.length ? band : iw / Math.max(1, n - 1)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
      )}
      {hover !== null && W > 0 && (
        <div className="chart-tip" style={{ left: Math.min(W - 90, Math.max(90, x(hover))), top: Math.max(0, Math.min(...series.map((s) => y(s.values[hover]))) - 8) }}>
          <b>{labels[hover]}</b>
          {series.map((s) => (
            <div key={s.name}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 6 }} />{s.name}: {fmt(s.values[hover])}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, color = "#0A0A0A", w = 92, h = 34 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const mn = Math.min(...values), mx = Math.max(...values), n = values.length;
  const x = (i: number) => 2 + (i * (w - 6)) / (n - 1);
  const y = (v: number) => h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 8);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polygon points={`${x(0)},${h} ${pts} ${x(n - 1)},${h}`} fill={color} opacity={0.08} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={x(n - 1)} cy={y(values[n - 1])} r={2.8} fill={color} />
    </svg>
  );
}

export const DONUT_COLORS = ["#0A0A0A", "#3D5AFE", "#5E5E5E", "#8FA2FF", "#9E9E9A", "#CFCFCA", "#F5A524"];

export function Donut({ segments, size = 168, center, caption }: { segments: { k: string; v: number }[]; size?: number; center: string; caption: string }) {
  const r = size / 2 - 14, C = 2 * Math.PI * r, tot = segments.reduce((a, s) => a + s.v, 0);
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${caption}: ${center}`} style={{ flex: "none" }}>
      {segments.map((s, i) => {
        const len = (s.v / tot) * C;
        const el = <circle key={s.k} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={20} strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        off += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" style={{ font: "600 18px var(--sans)", fill: "#0A0A0A" }}>{center}</text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" style={{ font: "400 11px var(--sans)", fill: "#5E5E5E" }}>{caption}</text>
    </svg>
  );
}

export function Legend({ items }: { items: { name: string; color: string; line?: boolean }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.name}><i style={{ background: i.color, ...(i.line ? { height: 2, width: 14 } : {}) }} />{i.name}</span>
      ))}
    </div>
  );
}
