import { ALL_MATCHES, getResult, isExact, isResultCorrect } from "../data/matches.js";

export const BADGE_DEFS = {
  EZ:           { emoji:"⚡", name:"EZ",             desc:"Marcador exacto acertado",                    coins:40,   type:"season" },
  GRITALO:      { emoji:"👑", name:"Grítalo Reina",  desc:"Más marcadores exactos de la jornada",        coins:100,  type:"dynamic" },
  SO_HOT:       { emoji:"🔥", name:"So Hot",         desc:"5-9 resultados correctos en una jornada",     coins:50,   type:"season" },
  ON_FIRE:      { emoji:"🚒", name:"Muy Caliente",   desc:"10-15 resultados correctos en una jornada",   coins:120,  type:"season" },
  MODO_BESTIA:  { emoji:"🐺", name:"En su Prime",    desc:"16+ resultados correctos en una jornada",     coins:200,  type:"season" },
  EN_SU_PRIME:  { emoji:"🌟", name:"Dios Plan",     desc:"Jornada perfecta — todos los resultados",    coins:400,  type:"season" },
  GGS:          { emoji:"🧊", name:"Hacker",        desc:"Acertó el partido con menor % de aciertos",   coins:80,   type:"season" },
  MIL_IQ:       { emoji:"🧠", name:"+1000 de IQ",   desc:"Único en acertar un resultado",               coins:150,  type:"season" },
  DELULU:       { emoji:"🤪", name:"Delulu",         desc:"Pronóstico más loco y fallido del grupo",     coins:-20,  type:"season" },
  QUE_BURRO:    { emoji:"🐴", name:"Que Burro, Póngale 0", desc:"Único en fallar lo que todos acertaron", coins:-30, type:"season" },
  LA_CABRA:     { emoji:"🐐", name:"La Cabra",       desc:"Mayor puntaje de la jornada",                 coins:130,  type:"dynamic" },
  CRUZAZULEO:   { emoji:"🔵", name:"La Cruzazuleó",  desc:"Segundo lugar de la jornada",                 coins:70,   type:"dynamic" },
  YA_MERITO:    { emoji:"🥉", name:"Ya Merito",      desc:"Tercer lugar de la jornada",                  coins:40,   type:"dynamic" },
  MEJOR_NADOTA: { emoji:"🗑️", name:"Mejor Nadota",   desc:"Último lugar de la jornada",                  coins:-30,  type:"dynamic" },
  F_WE:         { emoji:"💀", name:"F we",           desc:"Cero puntos en la jornada",                   coins:-60,  type:"dynamic" },
};

export const COIN_VALUES = Object.fromEntries(
  Object.entries(BADGE_DEFS).map(([k,v]) => [k, v.coins])
);

// Calculate badges for a completed jornada
export const calcBadgesForJornada = (jornada, participants, results) => {
  const jMatches = ALL_MATCHES.filter(m => m.jornada === jornada);
  const finishedMatches = jMatches.filter(m => results[m.id]?.homeGoals != null);
  if (finishedMatches.length === 0) return [];

  const awarded = []; // { participantId, badgeKey }

  // Per-participant stats
  const stats = participants.map(p => {
    const preds = p.predictions || {};
    let pts = 0, exactCount = 0, resultCount = 0;
    finishedMatches.forEach(m => {
      const pred = preds[m.id];
      const real = results[m.id];
      if (!pred) return;
      if (isExact(pred, real)) { exactCount++; pts += 3; }
      else if (isResultCorrect(pred, real)) { pts += 1; resultCount++; }
      // pts for result only (not exact)
    });
    // Recalc pts properly
    pts = 0;
    finishedMatches.forEach(m => {
      const pred = preds[m.id];
      const real = results[m.id];
      if (!pred) return;
      if (isExact(pred, real)) pts += 3;
      else if (isResultCorrect(pred, real)) pts += 1;
    });
    return { id: p.id, pts, exactCount, resultCount: resultCount + exactCount };
  });

  // ── EZ: one per exact match ──
  participants.forEach(p => {
    const preds = p.predictions || {};
    finishedMatches.forEach(m => {
      if (isExact(preds[m.id], results[m.id])) {
        awarded.push({ participantId: p.id, badgeKey: "EZ" });
      }
    });
  });

  // ── Grítalo Reina: most exact in jornada ──
  const maxExact = Math.max(...stats.map(s => s.exactCount));
  if (maxExact > 0) {
    stats.filter(s => s.exactCount === maxExact).forEach(s => {
      awarded.push({ participantId: s.id, badgeKey: "GRITALO" });
    });
  }

  // ── So Hot / On Fire / Modo Bestia / En su Prime ──
  stats.forEach(s => {
    if (s.resultCount === finishedMatches.length) {
      awarded.push({ participantId: s.id, badgeKey: "EN_SU_PRIME" });
    } else if (s.resultCount >= 16) {
      awarded.push({ participantId: s.id, badgeKey: "MODO_BESTIA" });
    } else if (s.resultCount >= 10) {
      awarded.push({ participantId: s.id, badgeKey: "ON_FIRE" });
    } else if (s.resultCount >= 5) {
      awarded.push({ participantId: s.id, badgeKey: "SO_HOT" });
    }
  });

  // ── GGs: acertó el partido con menor % de aciertos ──
  const matchAccuracy = finishedMatches.map(m => {
    const acertaron = participants.filter(p => isResultCorrect((p.predictions||{})[m.id], results[m.id])).length;
    return { matchId: m.id, pct: participants.length > 0 ? acertaron / participants.length : 0 };
  }).sort((a,b) => a.pct - b.pct);

  if (matchAccuracy.length > 0) {
    const hardestMatch = matchAccuracy[0];
    participants.forEach(p => {
      if (isResultCorrect((p.predictions||{})[hardestMatch.matchId], results[hardestMatch.matchId])) {
        awarded.push({ participantId: p.id, badgeKey: "GGS" });
      }
    });
  }

  // ── 1000 IQ: único en acertar un resultado ──
  finishedMatches.forEach(m => {
    const acertaron = participants.filter(p => isResultCorrect((p.predictions||{})[m.id], results[m.id]));
    if (acertaron.length === 1) {
      awarded.push({ participantId: acertaron[0].id, badgeKey: "MIL_IQ" });
    }
  });

  // ── Que Burro: único en fallar lo que todos acertaron ──
  finishedMatches.forEach(m => {
    const fallaron = participants.filter(p => !isResultCorrect((p.predictions||{})[m.id], results[m.id]));
    const acertaron = participants.filter(p => isResultCorrect((p.predictions||{})[m.id], results[m.id]));
    if (fallaron.length === 1 && acertaron.length === participants.length - 1) {
      awarded.push({ participantId: fallaron[0].id, badgeKey: "QUE_BURRO" });
    }
  });

  // ── Delulu: pronóstico incorrecto menos compartido ──
  const wrongPredCounts = {};
  participants.forEach(p => {
    finishedMatches.forEach(m => {
      const pred = (p.predictions||{})[m.id];
      if (!pred || isResultCorrect(pred, results[m.id])) return;
      const key = `${m.id}-${pred.home}-${pred.away}`;
      if (!wrongPredCounts[key]) wrongPredCounts[key] = { count: 0, pids: [], matchId: m.id };
      wrongPredCounts[key].count++;
      wrongPredCounts[key].pids.push(p.id);
    });
  });
  const wrongEntries = Object.values(wrongPredCounts);
  if (wrongEntries.length > 0) {
    const minCount = Math.min(...wrongEntries.map(e => e.count));
    wrongEntries.filter(e => e.count === minCount).forEach(e => {
      e.pids.forEach(pid => awarded.push({ participantId: pid, badgeKey: "DELULU" }));
    });
  }

  // ── Clasificación jornada: La Cabra, Cruzazuleó, Ya Merito, Mejor Nadota, F we ──
  const sorted = [...stats].sort((a,b) => b.pts - a.pts);
  if (sorted.length > 0) {
    const maxPts = sorted[0].pts;
    sorted.filter(s => s.pts === maxPts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "LA_CABRA" }));
    const rank2 = sorted.find(s => s.pts < maxPts);
    if (rank2) {
      sorted.filter(s => s.pts === rank2.pts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "CRUZAZULEO" }));
      const rank3 = sorted.find(s => s.pts < rank2.pts);
      if (rank3) {
        sorted.filter(s => s.pts === rank3.pts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "YA_MERITO" }));
      }
    }
    const minPts = sorted[sorted.length - 1].pts;
    sorted.filter(s => s.pts === minPts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "MEJOR_NADOTA" }));
    sorted.filter(s => s.pts === 0).forEach(s => awarded.push({ participantId: s.id, badgeKey: "F_WE" }));
  }

  return awarded;
};

// Calculate coins from badge list
export const calcCoinsFromBadges = (badgeKeys) => {
  return badgeKeys.reduce((sum, key) => sum + (COIN_VALUES[key] || 0), 0);
};
