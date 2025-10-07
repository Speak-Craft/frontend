import React from "react";

export default function Gauge({ value = 120, max = 200, width = 256 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const cx = width / 2, cy = width / 2, r = width * 0.4;
  const angle = Math.PI * (1 - pct);
  const nx = cx + r * Math.cos(angle), ny = cy - r * Math.sin(angle);

  function polar(cx, cy, r, deg){ const a = (deg*Math.PI)/180; return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)};}
  function arc(x, y, r, startDeg, endDeg){
    const s = polar(x, y, r, endDeg), e = polar(x, y, r, startDeg);
    const large = endDeg - startDeg <= 180 ? "0" : "1";
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${width/2}`} style={{ width }}>
        <path d={arc(cx, cy, r, 180, 120)} fill="none" stroke="#ff0000" strokeWidth="16" strokeLinecap="round"/>
        <path d={arc(cx, cy, r, 120, 60)}  fill="none" stroke="#ff9900" strokeWidth="16" strokeLinecap="round"/>
        <path d={arc(cx, cy, r, 60, 0)}    fill="none" stroke="#00cc00" strokeWidth="16" strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ffc107" strokeWidth="6" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="6" fill="#ffc107"/>
      </svg>
      <div className="mt-2 text-white font-semibold">{Math.round(pct * 100)}%</div>
    </div>
  );
}
