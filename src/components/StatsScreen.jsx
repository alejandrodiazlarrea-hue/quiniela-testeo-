import { useState } from "react";
import { ALL_MATCHES, calcScore, isResultCorrect } from "../data/matches.js";
import { C, card, sec, btn } from "./ui.jsx";

// ─── EVOLUTION CHART ──────────────────────────────────────────────────────────

const EvolutionChart = ({ participants, results }) => {
  const [highlighted, setHighlighted] = useState(null);

  // Calculate cumulative points per participant after each finished match
  const finishedByJornada = [1, 2, 3].map(j =>
    ALL_MATCHES.filter(m => m.jornada === j && results[m.id]?.homeGoals != null)
  );

  // Build data points: [0pts, afterJ1, afterJ2, afterJ3]
  const seriesData = participants.map(p => {
    let cumulative = 0;
    const points = [0];
    [1, 2, 3].forEach(j => {
      const jMatches = finishedByJornada[j - 1];
      jMatches.forEach(m => {
        const pred = (p.predictions || {})[m.id];
        const pts = calcScore(pred, results[m.id]);
        if (pts != null) cumulative += pts;
      });
      points.push(cumulative);
    });
    return { ...p, points };
  });

  const maxPts = Math.max(...seriesData.map(s => Math.max(...s.points)), 1);
  const labels = ["Inicio", "J1", "J2", "J3"];
  const colors = [
    "#e94560", "#4ade80", "#fbbf24", "#60a5fa", "#f472b6",
    "#a78bfa", "#34d399", "#fb923c", "#94a3b8", "#f87171",
    "#38bdf8", "#a3e635", "#e879f9", "#2dd4bf", "#facc15",
  ];

  const W = 500, H = 200, PAD = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const xStep = chartW / 3;

  const toX = (i) => PAD.left + i * xStep;
  const toY = (pts) => PAD.top + chartH - (pts / maxPts) * chartH;

  return (
    <div style={card}>
      <div style={sec}>📈 Evolución del Ranking</div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 300 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = PAD.top + chartH * (1 - pct);
            const val = Math.round(maxPts * pct);
            return (
              <g key={pct}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={PAD.left - 4} y={y + 4} textAnchor="end"
                  fill="#666" fontSize="9">{val}</text>
              </g>
            );
          })}

          {/* X labels */}
          {labels.map((l, i) => (
            <text key={i} x={toX(i)} y={H - 8} textAnchor="middle"
              fill="#888" fontSize="10">{l}</text>
          ))}

          {/* Lines */}
          {seriesData.map((p, pi) => {
            const color = colors[pi % colors.length];
            const isHigh = highlighted === p.id;
            const pathD = p.points.map((pts, i) =>
              `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(pts)}`
            ).join(" ");
            return (
              <g key={p.id}>
                <path d={pathD} fill="none" stroke={color}
                  strokeWidth={isHigh ? 3 : 1.5}
                  strokeOpacity={highlighted && !isHigh ? 0.2 : 1}
                  style={{ transition: "all .2s" }} />
                {p.points.map((pts, i) => (
                  <circle key={i} cx={toX(i)} cy={toY(pts)} r={isHigh ? 4 : 2.5}
                    fill={color} opacity={highlighted && !isHigh ? 0.2 : 1} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {seriesData.map((p, pi) => {
          const color = colors[pi % colors.length];
          const lastPts = p.points[p.points.length - 1];
          return (
            <div key={p.id}
              onMouseEnter={() => setHighlighted(p.id)}
              onMouseLeave={() => setHighlighted(null)}
              onClick={() => setHighlighted(highlighted === p.id ? null : p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: highlighted === p.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${highlighted === p.id ? color : "rgba(255,255,255,0.08)"}`,
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
              }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#ccc" }}>{p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{lastPts}pts</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Toca un nombre para resaltar su línea</div>
    </div>
  );
};

// ─── HEAD TO HEAD ─────────────────────────────────────────────────────────────

const HeadToHead = ({ participants, results }) => {
  const [p1Id, setP1Id] = useState(null);
  const [p2Id, setP2Id] = useState(null);

  const p1 = participants.find(p => p.id === p1Id);
  const p2 = participants.find(p => p.id === p2Id);

  const finishedMatches = ALL_MATCHES.filter(m => results[m.id]?.homeGoals != null);

  const calcH2H = () => {
    if (!p1 || !p2) return null;
    let p1wins = 0, p2wins = 0, draws = 0;
    let p1pts = 0, p2pts = 0;
    let p1exact = 0, p2exact = 0;
    const matchups = [];

    finishedMatches.forEach(m => {
      const pred1 = (p1.predictions || {})[m.id];
      const pred2 = (p2.predictions || {})[m.id];
      const real = results[m.id];
      const pts1 = calcScore(pred1, real) ?? 0;
      const pts2 = calcScore(pred2, real) ?? 0;
      p1pts += pts1;
      p2pts += pts2;
      if (pts1 === 3) p1exact++;
      if (pts2 === 3) p2exact++;
      if (pts1 > pts2) p1wins++;
      else if (pts2 > pts1) p2wins++;
      else draws++;
      matchups.push({ m, pts1, pts2 });
    });

    return { p1wins, p2wins, draws, p1pts, p2pts, p1exact, p2exact, matchups };
  };

  const h2h = calcH2H();
  const total = h2h ? h2h.p1wins + h2h.p2wins + h2h.draws : 0;

  const StatBox = ({ label, v1, v2, highlight }) => (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: highlight === "p1" || v1 > v2 ? C.red : "#ccc" }}>{v1}</span>
        <span style={{ fontSize: 11, color: "#555" }}>vs</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: highlight === "p2" || v2 > v1 ? "#4ade80" : "#ccc" }}>{v2}</span>
      </div>
    </div>
  );

  return (
    <div style={card}>
      <div style={sec}>⚔️ Head to Head</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select style={{ flex: 1, background: "#0f3460", border: "1px solid #444", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 14, outline: "none" }}
          value={p1Id || ""} onChange={e => setP1Id(Number(e.target.value) || null)}>
          <option value="">Jugador 1</option>
          {participants.filter(p => p.id !== p2Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", fontWeight: 900, color: "#555" }}>vs</div>
        <select style={{ flex: 1, background: "#0f3460", border: "1px solid #444", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 14, outline: "none" }}
          value={p2Id || ""} onChange={e => setP2Id(Number(e.target.value) || null)}>
          <option value="">Jugador 2</option>
          {participants.filter(p => p.id !== p1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!h2h ? (
        <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "20px 0" }}>
          Selecciona dos participantes para comparar
        </div>
      ) : finishedMatches.length === 0 ? (
        <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "20px 0" }}>
          Aún no hay partidos terminados
        </div>
      ) : (
        <>
          {/* Winner banner */}
          <div style={{ textAlign: "center", marginBottom: 16, padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
            {h2h.p1pts > h2h.p2pts ? (
              <div>
                <span style={{ color: C.red, fontWeight: 900, fontSize: 16 }}>🐐 {p1.name}</span>
                <span style={{ color: "#888", fontSize: 13 }}> va ganando</span>
              </div>
            ) : h2h.p2pts > h2h.p1pts ? (
              <div>
                <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16 }}>🐐 {p2.name}</span>
                <span style={{ color: "#888", fontSize: 13 }}> va ganando</span>
              </div>
            ) : (
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>🤝 Empate total</div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <StatBox label="Pts totales" v1={h2h.p1pts} v2={h2h.p2pts} />
            <StatBox label="Exactos" v1={h2h.p1exact} v2={h2h.p2exact} />
            <StatBox label="Partidos ganados" v1={h2h.p1wins} v2={h2h.p2wins} />
          </div>

          {/* Win bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 4 }}>
              <span style={{ color: C.red, fontWeight: 700 }}>{p1.name} {h2h.p1wins}W</span>
              <span style={{ color: "#fbbf24" }}>{h2h.draws}E</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>{h2h.p2wins}W {p2.name}</span>
            </div>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ flex: h2h.p1wins || 0.01, background: C.red }} />
              <div style={{ flex: h2h.draws || 0.01, background: "#7f6a00" }} />
              <div style={{ flex: h2h.p2wins || 0.01, background: "#1b7f4a" }} />
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 4, textAlign: "center" }}>
              {total} partidos disputados
            </div>
          </div>

          {/* Last 5 matchups */}
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 700 }}>Últimos partidos</div>
            {h2h.matchups.slice(-5).reverse().map(({ m, pts1, pts2 }) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                <span style={{ color: "#666", minWidth: 60 }}>G{m.group} J{m.jornada}</span>
                <span style={{ flex: 1, color: "#ccc" }}>{m.home} vs {m.away}</span>
                <span style={{ fontWeight: 700, color: pts1 > pts2 ? C.red : pts1 === pts2 ? "#fbbf24" : "#555", minWidth: 20, textAlign: "center" }}>{pts1}</span>
                <span style={{ color: "#555" }}>-</span>
                <span style={{ fontWeight: 700, color: pts2 > pts1 ? "#4ade80" : pts2 === pts1 ? "#fbbf24" : "#555", minWidth: 20, textAlign: "center" }}>{pts2}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export const StatsScreen = ({ participants, results }) => (
  <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>
    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
      📊 <span style={{ color: C.red }}>Estadísticas</span>
    </div>
    <EvolutionChart participants={participants} results={results} />
    <HeadToHead participants={participants} results={results} />
  </div>
);
