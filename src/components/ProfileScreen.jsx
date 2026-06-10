import { ALL_MATCHES, calcScore, isExact, isResultCorrect } from "../data/matches.js";
import { BADGE_DEFS, calcCoinsFromBadges } from "../data/badges.js";
import { C, card, sec } from "./ui.jsx";

export const ProfileScreen = ({ participant, results, earnedBadges, coins }) => {
  if (!participant) return null;

  const pBadges = earnedBadges.filter(b => b.participant_id === participant.id);
  const pCoins = coins.find(c => c.participant_id === participant.id)?.total || 0;

  // Stats
  const finishedMatches = ALL_MATCHES.filter(m => results[m.id]?.homeGoals != null);
  let totalPts = 0, totalExact = 0, totalResult = 0;
  const byJornada = {1:{pts:0,played:0}, 2:{pts:0,played:0}, 3:{pts:0,played:0}};

  finishedMatches.forEach(m => {
    const pred = (participant.predictions||{})[m.id];
    const real = results[m.id];
    if (!pred) return;
    const pts = calcScore(pred, real) || 0;
    totalPts += pts;
    if (isExact(pred, real)) totalExact++;
    if (isResultCorrect(pred, real)) totalResult++;
    byJornada[m.jornada].pts += pts;
    byJornada[m.jornada].played++;
  });

  const jornadas = Object.entries(byJornada).filter(([,v]) => v.played > 0);
  const bestJ = jornadas.length > 0 ? jornadas.reduce((a,b) => b[1].pts > a[1].pts ? b : a) : null;
  const worstJ = jornadas.length > 0 ? jornadas.reduce((a,b) => b[1].pts < a[1].pts ? b : a) : null;

  // Badge counts
  const badgeCounts = {};
  pBadges.forEach(b => { badgeCounts[b.badge_key] = (badgeCounts[b.badge_key]||0)+1; });
  const sortedBadges = Object.entries(badgeCounts).sort((a,b) => b[1]-a[1]);

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ ...card, textAlign:"center", padding:"24px 20px" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>👤</div>
        <div style={{ fontSize:24, fontWeight:900 }}>{participant.name}</div>
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:C.red }}>{totalPts}</div>
            <div style={{ fontSize:11, color:"#888" }}>pts totales</div>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:"#fbbf24" }}>{pCoins}</div>
            <div style={{ fontSize:11, color:"#888" }}>FIFA Coins 🪙</div>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:"#4ade80" }}>{totalExact}</div>
            <div style={{ fontSize:11, color:"#888" }}>exactos</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={card}>
        <div style={sec}>📊 Resumen</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"Total de aciertos", value:totalResult },
            { label:"Marcadores exactos", value:totalExact },
            { label:"Mejor jornada", value:bestJ?`J${bestJ[0]} (${bestJ[1].pts}pts)`:"—" },
            { label:"Peor jornada", value:worstJ?`J${worstJ[0]} (${worstJ[1].pts}pts)`:"—" },
            { label:"Partidos jugados", value:finishedMatches.filter(m=>(participant.predictions||{})[m.id]).length },
            { label:"Promedio pts/jornada", value:jornadas.length>0?(totalPts/jornadas.length).toFixed(1):"—" },
          ].map(s=>(
            <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.red }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose por jornada */}
      <div style={card}>
        <div style={sec}>📅 Por jornada</div>
        <div style={{ display:"flex", gap:10 }}>
          {[1,2,3].map(j => (
            <div key={j} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Jornada {j}</div>
              <div style={{ fontSize:24, fontWeight:900, color:byJornada[j].played>0?C.red:"#444" }}>{byJornada[j].pts}</div>
              <div style={{ fontSize:11, color:"#555" }}>{byJornada[j].played} partidos</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {sortedBadges.length > 0 && (
        <div style={card}>
          <div style={sec}>🏅 Badges acumulados</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {sortedBadges.map(([key, count]) => {
              const def = BADGE_DEFS[key];
              if (!def) return null;
              return (
                <div key={key} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:"8px 12px", textAlign:"center", minWidth:80 }}>
                  <div style={{ fontSize:24 }}>{def.emoji}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#ccc", marginTop:4 }}>{def.name}</div>
                  {count>1&&<div style={{ fontSize:10, color:C.red, fontWeight:700 }}>x{count}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FIFA Coins history */}
      <div style={card}>
        <div style={sec}>🪙 FIFA Coins</div>
        <div style={{ textAlign:"center", padding:"8px 0" }}>
          <div style={{ fontSize:40, fontWeight:900, color:"#fbbf24" }}>{pCoins >= 0 ? `+${pCoins}` : pCoins}</div>
          <div style={{ fontSize:13, color:"#888", marginTop:4 }}>coins acumuladas en el torneo</div>
        </div>
        {/* Coins per badge type */}
        <div style={{ marginTop:12 }}>
          {sortedBadges.map(([key, count]) => {
            const def = BADGE_DEFS[key];
            if (!def || def.coins === 0) return null;
            const total = def.coins * count;
            return (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13 }}>
                <span>{def.emoji} {def.name} x{count}</span>
                <span style={{ color: total>=0?"#4ade80":"#f87171", fontWeight:700 }}>{total>=0?`+${total}`:total} 🪙</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
