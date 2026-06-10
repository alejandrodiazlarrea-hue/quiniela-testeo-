import { useState } from "react";
import { ALL_MATCHES, FLAGS, ABBR } from "../data/matches.js";
import { C, card, sec, inp, btn } from "./ui.jsx";

const buildGroupTable = (group, results) => {
  const matches = ALL_MATCHES.filter(m => m.group === group && results[m.id]?.homeGoals != null);
  const teams = {};
  ALL_MATCHES.filter(m => m.group === group).forEach(m => {
    if (!teams[m.home]) teams[m.home] = {name:m.home, pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0};
    if (!teams[m.away]) teams[m.away] = {name:m.away, pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0};
  });
  matches.forEach(m => {
    const r = results[m.id];
    const h = teams[m.home], a = teams[m.away];
    h.pj++; a.pj++;
    h.gf += r.homeGoals; h.gc += r.awayGoals;
    a.gf += r.awayGoals; a.gc += r.homeGoals;
    if (r.homeGoals > r.awayGoals) { h.g++; h.pts+=3; a.p++; }
    else if (r.awayGoals > r.homeGoals) { a.g++; a.pts+=3; h.p++; }
    else { h.e++; a.e++; h.pts+=1; a.pts+=1; }
  });
  return Object.values(teams).sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const dgA = a.gf-a.gc, dgB = b.gf-b.gc;
    if (dgB !== dgA) return dgB - dgA;
    return b.gf - a.gf;
  }).map((t,i) => ({...t, pos:i+1, dg:t.gf-t.gc}));
};

export const MundialScreen = ({ results, scorers, onUpsertScorer, onDeleteScorer, isAdmin }) => {
  const [tab, setTab] = useState("grupos");
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [editScorer, setEditScorer] = useState(null);
  const [scorerForm, setScorerForm] = useState({ player_name:"", team:"", goals:0 });

  const groups = [...new Set(ALL_MATCHES.map(m => m.group))];
  const tableData = buildGroupTable(selectedGroup, results);

  const posColors = ["#ffd700","#c0c0c0","#cd7f32",""];

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:16 }}>🌎 <span style={{color:C.red}}>Mundial</span> 2026</div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["grupos","🏆 Grupos"],["goleadores","⚽ Goleadores"]].map(([t,l])=>(
          <button key={t} style={{...btn(tab===t?"primary":"outline"), flex:1}} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab==="grupos" && (
        <>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
            {groups.map(g=>(
              <button key={g} style={{...btn(selectedGroup===g?"primary":"outline-gray"), padding:"6px 14px", fontSize:13}}
                onClick={()=>setSelectedGroup(g)}>
                Grupo {g}
              </button>
            ))}
          </div>

          <div style={card}>
            <div style={sec}>Grupo {selectedGroup}</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ color:"#666", fontSize:11, textTransform:"uppercase" }}>
                    {["#","Selección","PJ","G","E","P","GF","GC","DG","PTS"].map(h=>(
                      <th key={h} style={{ padding:"6px 8px", textAlign:h==="Selección"?"left":"center", fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((t,i)=>(
                    <tr key={t.name} style={{ borderTop:"1px solid rgba(255,255,255,0.06)", background:i<2?"rgba(233,69,96,0.06)":"transparent" }}>
                      <td style={{ padding:"8px", textAlign:"center" }}>
                        <span style={{ color:posColors[i]||"#888", fontWeight:700 }}>{t.pos}</span>
                      </td>
                      <td style={{ padding:"8px", fontWeight:600 }}>
                        {FLAGS[t.name]||"🏳️"} {ABBR[t.name]||t.name}
                      </td>
                      {[t.pj,t.g,t.e,t.p,t.gf,t.gc,t.dg>=0?`+${t.dg}`:t.dg,t.pts].map((v,vi)=>(
                        <td key={vi} style={{ padding:"8px", textAlign:"center", fontWeight:vi===7?900:"normal", color:vi===7?C.red:"#ccc" }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize:11, color:"#555", marginTop:8 }}>🔴 Clasifican a Ronda de 32</div>
          </div>
        </>
      )}

      {tab==="goleadores" && (
        <div style={card}>
          <div style={sec}>⚽ Top Goleadores</div>
          {scorers.length === 0 ? (
            <div style={{ color:"#555", fontSize:13, textAlign:"center", padding:"20px 0" }}>
              {isAdmin ? "Agrega goleadores desde aquí." : "El admin aún no ha registrado goleadores."}
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ color:"#666", fontSize:11, textTransform:"uppercase" }}>
                  {["#","Jugador","Selección","Goles",""].map((h,i)=>(
                    <th key={i} style={{ padding:"6px 8px", textAlign:i===3?"center":i===4?"right":"left", fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scorers.slice(0,5).map((s,i)=>(
                  <tr key={s.id} style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding:"8px", color:posColors[i]||"#888", fontWeight:700 }}>{i+1}</td>
                    <td style={{ padding:"8px", fontWeight:600 }}>{s.player_name}</td>
                    <td style={{ padding:"8px", color:"#888" }}>{FLAGS[s.team]||"🏳️"} {ABBR[s.team]||s.team}</td>
                    <td style={{ padding:"8px", textAlign:"center", fontWeight:900, color:C.red, fontSize:18 }}>{s.goals}</td>
                    <td style={{ padding:"8px", textAlign:"right" }}>
                      {isAdmin && (
                        <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                          <button style={{ background:"#0f3460", border:"none", color:"#fff", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:12 }}
                            onClick={()=>{ setEditScorer(s.id); setScorerForm({player_name:s.player_name,team:s.team,goals:s.goals}); }}>
                            ✏️
                          </button>
                          <button style={{ background:"#7f1b1b", border:"none", color:"#fff", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:12 }}
                            onClick={()=>onDeleteScorer(s.id)}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isAdmin && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:10 }}>
                {editScorer ? "✏️ Editar goleador" : "➕ Agregar goleador"}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <input style={{...inp, flex:2, minWidth:120}} placeholder="Nombre del jugador"
                  value={scorerForm.player_name} onChange={e=>setScorerForm(p=>({...p,player_name:e.target.value}))} />
                <input style={{...inp, flex:1, minWidth:100}} placeholder="Selección"
                  value={scorerForm.team} onChange={e=>setScorerForm(p=>({...p,team:e.target.value}))} />
                <input style={{...inp, width:70}} type="number" min="0" placeholder="Goles"
                  value={scorerForm.goals} onChange={e=>setScorerForm(p=>({...p,goals:Number(e.target.value)}))} />
                <button style={btn()} onClick={()=>{
                  if (!scorerForm.player_name.trim()) return;
                  onUpsertScorer(editScorer ? {...scorerForm, id:editScorer} : scorerForm);
                  setScorerForm({player_name:"",team:"",goals:0});
                  setEditScorer(null);
                }}>{editScorer?"Guardar":"Agregar"}</button>
                {editScorer && <button style={btn("outline")} onClick={()=>{ setEditScorer(null); setScorerForm({player_name:"",team:"",goals:0}); }}>Cancelar</button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
