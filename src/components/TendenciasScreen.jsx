import { useState } from "react";
import { ALL_MATCHES, FLAGS, ABBR, getResult, isExact, isResultCorrect } from "../data/matches.js";
import { C, card, sec, pill } from "./ui.jsx";

export const TendenciasScreen = ({ participants, results, openJornadas }) => {
  const [jFilter, setJFilter] = useState(0);

  const matches = jFilter === 0
    ? ALL_MATCHES
    : ALL_MATCHES.filter(m => m.jornada === jFilter);

  const finished = matches.filter(m => results[m.id]?.homeGoals != null);
  const total = participants.length;

  // Team support count
  const teamSupport = {};
  matches.forEach(m => {
    if (!teamSupport[m.home]) teamSupport[m.home] = 0;
    if (!teamSupport[m.away]) teamSupport[m.away] = 0;
    participants.forEach(p => {
      const pred = (p.predictions||{})[m.id];
      if (!pred || pred.home == null) return;
      const res = getResult(Number(pred.home), Number(pred.away));
      if (res === "H") teamSupport[m.home]++;
      else if (res === "A") teamSupport[m.away]++;
    });
  });
  const teamEntries = Object.entries(teamSupport).sort((a,b)=>b[1]-a[1]);
  const mostBacked = teamEntries[0];
  const leastBacked = teamEntries[teamEntries.length-1];

  // Result distribution
  let homeWins=0, awayWins=0, draws=0, totalPreds=0;
  let exactScores = {};
  matches.forEach(m => {
    participants.forEach(p => {
      const pred = (p.predictions||{})[m.id];
      if (!pred || pred.home == null) return;
      totalPreds++;
      const r = getResult(Number(pred.home), Number(pred.away));
      if (r==="H") homeWins++;
      else if (r==="A") awayWins++;
      else draws++;
      const key = `${pred.home}-${pred.away}`;
      exactScores[key] = (exactScores[key]||0)+1;
    });
  });
  const popularScore = Object.entries(exactScores).sort((a,b)=>b[1]-a[1])[0];

  // Consensus per match
  const matchConsensus = matches.map(m => {
    const preds = participants.map(p => (p.predictions||{})[m.id]).filter(p=>p&&p.home!=null);
    if (preds.length === 0) return { m, pct:0, result:"—" };
    const resCounts = {};
    preds.forEach(p => {
      const r = getResult(Number(p.home), Number(p.away));
      resCounts[r] = (resCounts[r]||0)+1;
    });
    const top = Object.entries(resCounts).sort((a,b)=>b[1]-a[1])[0];
    return { m, pct: top[1]/preds.length, result: top[0] };
  }).filter(x => x.pct > 0);

  matchConsensus.sort((a,b)=>b.pct-a.pct);
  const mostConsensus = matchConsensus[0];
  const leastConsensus = matchConsensus[matchConsensus.length-1];

  // Contrarian participant
  const contrarian = participants.map(p => {
    let diff = 0;
    matches.forEach(m => {
      const pred = (p.predictions||{})[m.id];
      if (!pred || pred.home == null) return;
      const myRes = getResult(Number(pred.home), Number(pred.away));
      const majority = (() => {
        const resCounts = {};
        participants.forEach(pp => {
          const pp2 = (pp.predictions||{})[m.id];
          if (!pp2 || pp2.home == null) return;
          const r = getResult(Number(pp2.home), Number(pp2.away));
          resCounts[r] = (resCounts[r]||0)+1;
        });
        return Object.entries(resCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
      })();
      if (myRes !== majority) diff++;
    });
    return { ...p, diff };
  }).sort((a,b)=>b.diff-a.diff);

  // Post-jornada stats (only for finished matches)
  const groupAciertos = finished.length > 0 ? (() => {
    let totalAciertos=0, totalExactos=0;
    let matchAciertos = finished.map(m => {
      const acertaron = participants.filter(p => isResultCorrect((p.predictions||{})[m.id], results[m.id])).length;
      return { m, acertaron, pct: total>0?acertaron/total:0 };
    });
    participants.forEach(p => {
      finished.forEach(m => {
        if (isResultCorrect((p.predictions||{})[m.id], results[m.id])) totalAciertos++;
        if (isExact((p.predictions||{})[m.id], results[m.id])) totalExactos++;
      });
    });
    const mas50 = participants.filter(p => {
      const aci = finished.filter(m => isResultCorrect((p.predictions||{})[m.id], results[m.id])).length;
      return aci / finished.length > 0.5;
    }).length;
    const cero = participants.filter(p => {
      return finished.every(m => !isResultCorrect((p.predictions||{})[m.id], results[m.id]));
    }).length;
    matchAciertos.sort((a,b)=>b.pct-a.pct);
    const sorpresa = matchAciertos[matchAciertos.length-1];
    return { totalAciertos, totalExactos, mas50, cero, sorpresa, bestMatch:matchAciertos[0], pctGlobal: total>0&&finished.length>0?totalAciertos/(total*finished.length):0 };
  })() : null;

  const resultLabel = r => r==="H"?"Local":r==="A"?"Visitante":r==="D"?"Empate":"—";

  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🔮 <span style={{color:C.red}}>Tendencias</span> del Grupo</div>
      <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>Patrones y consensos de los pronósticos</div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[[0,"Todo el torneo"],[1,"Jornada 1"],[2,"Jornada 2"],[3,"Jornada 3"]].map(([j,l])=>(
          <button key={j} style={{
            background:jFilter===j?C.red:"transparent",
            border:`1px solid ${jFilter===j?C.red:"#333"}`,
            color:jFilter===j?"#fff":"#aaa",
            borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600
          }} onClick={()=>setJFilter(j)}>{l}</button>
        ))}
      </div>

      {/* Pronósticos generales */}
      <div style={card}>
        <div style={sec}>📊 Distribución de pronósticos</div>
        {totalPreds > 0 ? (
          <>
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              {[
                {label:"🏠 Local gana", pct:homeWins/totalPreds, color:C.red},
                {label:"✈️ Visitante gana", pct:awayWins/totalPreds, color:"#0f3460"},
                {label:"🤝 Empate", pct:draws/totalPreds, color:"#666"},
              ].map(item=>(
                <div key={item.label} style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:item.color }}>{Math.round(item.pct*100)}%</div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, marginTop:4 }}>
                    <div style={{ height:"100%", width:`${item.pct*100}%`, background:item.color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>
            {popularScore && (
              <div style={{ fontSize:13, color:"#888" }}>
                Marcador más popular: <span style={{ color:"#fff", fontWeight:700 }}>{popularScore[0]}</span>
                <span style={{ color:"#555" }}> ({popularScore[1]} veces)</span>
              </div>
            )}
          </>
        ) : <div style={{ color:"#555", fontSize:13 }}>Sin pronósticos registrados aún.</div>}
      </div>

      {/* Equipos */}
      {mostBacked && (
        <div style={card}>
          <div style={sec}>🌍 Equipos</div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, background:"rgba(27,127,74,0.1)", border:"1px solid #1b7f4a", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Más respaldado</div>
              <div style={{ fontSize:20 }}>{FLAGS[mostBacked[0]]||"🏳️"}</div>
              <div style={{ fontWeight:700 }}>{ABBR[mostBacked[0]]||mostBacked[0]}</div>
              <div style={{ fontSize:12, color:"#4ade80" }}>{mostBacked[1]} pronósticos</div>
            </div>
            <div style={{ flex:1, background:"rgba(127,27,27,0.1)", border:"1px solid #7f1b1b", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Menos respaldado</div>
              <div style={{ fontSize:20 }}>{FLAGS[leastBacked[0]]||"🏳️"}</div>
              <div style={{ fontWeight:700 }}>{ABBR[leastBacked[0]]||leastBacked[0]}</div>
              <div style={{ fontSize:12, color:"#f87171" }}>{leastBacked[1]} pronósticos</div>
            </div>
          </div>
        </div>
      )}

      {/* Consenso */}
      {mostConsensus && (
        <div style={card}>
          <div style={sec}>🎯 Consenso</div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>Mayor consenso</div>
              <div style={{ fontWeight:700, fontSize:13 }}>
                {ABBR[mostConsensus.m.home]} vs {ABBR[mostConsensus.m.away]}
              </div>
              <div style={{ fontSize:12, color:"#888" }}>{resultLabel(mostConsensus.result)}</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.red }}>{Math.round(mostConsensus.pct*100)}%</div>
            </div>
            {leastConsensus && (
              <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px" }}>
                <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>Más dividido</div>
                <div style={{ fontWeight:700, fontSize:13 }}>
                  {ABBR[leastConsensus.m.home]} vs {ABBR[leastConsensus.m.away]}
                </div>
                <div style={{ fontSize:12, color:"#888" }}>{resultLabel(leastConsensus.result)}</div>
                <div style={{ fontSize:18, fontWeight:900, color:"#fbbf24" }}>{Math.round(leastConsensus.pct*100)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contrarian */}
      {contrarian.length > 0 && (
        <div style={card}>
          <div style={sec}>🤔 vs el grupo</div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Más diferente al consenso</div>
              <div style={{ fontWeight:700 }}>{contrarian[0]?.name}</div>
              <div style={{ fontSize:12, color:"#f87171" }}>{contrarian[0]?.diff} pronósticos distintos</div>
            </div>
            <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>Más alineado al consenso</div>
              <div style={{ fontWeight:700 }}>{contrarian[contrarian.length-1]?.name}</div>
              <div style={{ fontSize:12, color:"#4ade80" }}>{contrarian[contrarian.length-1]?.diff} pronósticos distintos</div>
            </div>
          </div>
        </div>
      )}

      {/* Post-jornada stats */}
      {groupAciertos && finished.length > 0 && (
        <div style={card}>
          <div style={sec}>✅ Resultados del grupo</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[
              {label:"% global de aciertos", value:`${Math.round(groupAciertos.pctGlobal*100)}%`},
              {label:"Marcadores exactos", value:groupAciertos.totalExactos},
              {label:"Acertaron +50%", value:`${groupAciertos.mas50} participantes`},
              {label:"Con cero puntos", value:`${groupAciertos.cero} participantes`},
            ].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px" }}>
                <div style={{ fontSize:11, color:"#888" }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.red, marginTop:4 }}>{s.value}</div>
              </div>
            ))}
          </div>
          {groupAciertos.sorpresa && (
            <div style={{ fontSize:13, color:"#888" }}>
              😱 Resultado más sorprendente:{" "}
              <span style={{ color:"#fff", fontWeight:700 }}>
                {ABBR[groupAciertos.sorpresa.m.home]} vs {ABBR[groupAciertos.sorpresa.m.away]}
              </span>
              <span style={{ color:"#555" }}> (solo {groupAciertos.sorpresa.acertaron} acertaron)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
