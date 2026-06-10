import { useState, useEffect, useCallback } from "react";
import { db } from "./lib/supabase.js";
import { ALL_MATCHES, FLAGS, ABBR, calcScore, isExact, isResultCorrect, getResult } from "./data/matches.js";
import { BADGE_DEFS, calcBadgesForJornada, calcCoinsFromBadges } from "./data/badges.js";
import { C, inp, card, sec, row, btn, pill, ScoreInput, DateHeader, Flash, CountdownBanner, PasswordModal } from "./components/ui.jsx";
import { BadgesScreen } from "./components/BadgesScreen.jsx";
import { ProfileScreen } from "./components/ProfileScreen.jsx";
import { MundialScreen } from "./components/MundialScreen.jsx";
import { TendenciasScreen } from "./components/TendenciasScreen.jsx";
import { QuizScreen } from "./components/QuizScreen.jsx";
import { StatsScreen } from "./components/StatsScreen.jsx";

// ─── HOME ─────────────────────────────────────────────────────────────────────

const HomeScreen = ({participants,adminAuth,participantName,setParticipantName,passInput,setPassInput,passError,handleNewParticipant,handleAdminLogin,handleSelectParticipant,setScreen,openJornadas}) => (
  <div style={{maxWidth:520,margin:"0 auto",padding:"24px 16px"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:60,marginBottom:8}}>⚽</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:0,color:"#fff"}}>Quiniela <span style={{color:C.red}}>Mundial 2026</span></h1>
      <p style={{color:"#888",marginTop:8,fontSize:14}}>48 equipos · 12 grupos · 72 partidos · 11 Jun – 27 Jun</p>
    </div>
    <CountdownBanner openJornadas={openJornadas}/>
    <div style={card}>
      <div style={sec}>Soy participante</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input style={inp} placeholder="Tu nombre (nuevo)" value={participantName}
          onChange={e=>setParticipantName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleNewParticipant()}/>
        <button style={{...btn(),whiteSpace:"nowrap"}} onClick={handleNewParticipant}>Registrarme</button>
      </div>
      {participants.length>0&&(
        <>
          <div style={{color:"#888",fontSize:12,marginBottom:8}}>Ya tengo cuenta — selecciona tu nombre:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {participants.map(p=><button key={p.id} style={btn("outline")} onClick={()=>handleSelectParticipant(p)}>{p.name}</button>)}
          </div>
        </>
      )}
    </div>
    <div style={card}>
      <div style={sec}>Acceso Administrador</div>
      {!adminAuth?(
        <div style={{display:"flex",gap:8}}>
          <input style={inp} type="password" placeholder="Contraseña" value={passInput}
            onChange={e=>setPassInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
          <button style={btn()} onClick={handleAdminLogin}>Entrar</button>
        </div>
      ):(
        <button style={btn()} onClick={()=>setScreen("admin")}>Panel de Admin</button>
      )}
      {passError&&<div style={{color:C.red,fontSize:12,marginTop:6}}>Contraseña incorrecta</div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <button style={{...btn("outline"),width:"100%"}} onClick={()=>setScreen("ranking")}>🏆 Ver Tabla General</button>
      <button style={{...btn("outline"),width:"100%"}} onClick={()=>setScreen("pronosticos")}>📋 Ver Pronósticos de Todos</button>
    </div>
  </div>
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────

const AdminScreen = ({participants,results,openJornadas,savedMsg,handleResultChange,toggleJornada,newAdminPass,setNewAdminPass,handleChangePass,ranking,handleDeleteParticipant,handleCalcBadges,quizOpenDates,handleQuizToggle,handleRenameParticipant}) => {
  const [gFilter,setGFilter]=useState("Todos");
  const [jFilter,setJFilter]=useState(0);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [editingName,setEditingName]=useState(null);
  const [newNameInput,setNewNameInput]=useState("");
  const [newQuizLabel,setNewQuizLabel]=useState("");
  const groups=[...new Set(ALL_MATCHES.map(m=>m.group))];
  const filtered=ALL_MATCHES.filter(m=>(gFilter==="Todos"||m.group===gFilter)&&(jFilter===0||m.jornada===jFilter));
  const byDate=filtered.reduce((acc,m)=>{if(!acc[m.date])acc[m.date]=[];acc[m.date].push(m);return acc;},{});

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:900}}>Panel de <span style={{color:C.red}}>Administrador</span></div>
          <div style={{fontSize:12,color:"#888"}}>{participants.length} participante(s)</div>
        </div>
        <Flash msg={savedMsg}/>
      </div>

      {/* Jornadas */}
      <div style={card}>
        <div style={sec}>Control de Jornadas</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[1,2,3].map(j=>{
            const dates={1:"11–17 Jun",2:"18–23 Jun",3:"24–27 Jun"};
            return (
              <div key={j} style={{flex:1,background:openJornadas[j]?"rgba(27,127,74,0.15)":"rgba(233,69,96,0.08)",border:"1px solid "+(openJornadas[j]?"#1b7f4a":"#333"),borderRadius:10,padding:"14px 16px",textAlign:"center",minWidth:120}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>Jornada {j}</div>
                <div style={{fontSize:10,color:"#666",marginBottom:6}}>{dates[j]}</div>
                <div style={{fontSize:11,color:openJornadas[j]?"#4ade80":"#888",marginBottom:8}}>{openJornadas[j]?"🟢 ABIERTA":"🔴 CERRADA"}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button style={btn(openJornadas[j]?"success":"outline")} onClick={()=>toggleJornada(j)}>
                    {openJornadas[j]?"Cerrar":"Abrir"}
                  </button>
                  {!openJornadas[j]&&(
                    <button style={{...btn("outline-gray"),fontSize:12,padding:"6px 10px"}} onClick={()=>handleCalcBadges(j)}>
                      🏅 Calcular badges J{j}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resultados */}
      <div style={card}>
        <div style={sec}>Capturar Resultados</div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <select style={{...inp,width:"auto"}} value={gFilter} onChange={e=>setGFilter(e.target.value)}>
            <option value="Todos">Todos los grupos</option>
            {groups.map(g=><option key={g} value={g}>Grupo {g}</option>)}
          </select>
          <select style={{...inp,width:"auto"}} value={jFilter} onChange={e=>setJFilter(Number(e.target.value))}>
            <option value={0}>Todas las jornadas</option>
            <option value={1}>Jornada 1</option>
            <option value={2}>Jornada 2</option>
            <option value={3}>Jornada 3</option>
          </select>
        </div>
        {Object.entries(byDate).map(([date,matches])=>(
          <div key={date}>
            <DateHeader dateStr={date}/>
            {matches.map(m=>{
              const r=results[m.id]||{};
              const done=r.homeGoals!=null&&r.awayGoals!=null;
              return (
                <div key={m.id} style={row}>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <span style={pill("#1a1a2e")}>G{m.group}</span>
                    <span style={pill("#0f2d6e")}>J{m.jornada}</span>
                    <span style={{fontSize:11,color:"#666",alignSelf:"center"}}>{m.time}</span>
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                    <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52,textAlign:"right"}}>{FLAGS[m.home]||"🏳️"} {ABBR[m.home]||m.home}</span>
                    <ScoreInput value={r.homeGoals} onChange={v=>handleResultChange(m.id,"homeGoals",v)}/>
                    <span style={{color:"#555",fontSize:12}}>-</span>
                    <ScoreInput value={r.awayGoals} onChange={v=>handleResultChange(m.id,"awayGoals",v)}/>
                    <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52}}>{ABBR[m.away]||m.away} {FLAGS[m.away]||"🏳️"}</span>
                    {done&&<span style={{background:"rgba(27,127,74,0.2)",border:"1px solid #1b7f4a",color:"#4ade80",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quiz management */}
      <div style={card}>
        <div style={sec}>🧠 Control de Quizzes</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {Array.from({length:17},(_,i)=>{
            const label=`quiz-${i+1}`;
            const isOpen=quizOpenDates&&quizOpenDates.includes(label);
            return (
              <button key={label} onClick={()=>handleQuizToggle(label)}
                style={{background:isOpen?"rgba(27,127,74,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${isOpen?"#1b7f4a":"#333"}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"center",minWidth:56,color:isOpen?"#4ade80":"#888"}}>
                <div style={{fontSize:11,fontWeight:700,color:isOpen?"#4ade80":"#ccc"}}>Quiz</div>
                <div style={{fontSize:20,fontWeight:900,color:isOpen?"#4ade80":"#ccc"}}>{i+1}</div>
                {isOpen&&<div style={{fontSize:10,color:"#4ade80",marginTop:2}}>🟢</div>}
              </button>
            );
          })}
        </div>
        <div style={{fontSize:12,color:"#888"}}>Click en un quiz para abrirlo o cerrarlo. Verde = abierto.</div>
      </div>

      {/* Contraseña */}
      <div style={card}>
        <div style={sec}>Cambiar Contraseña Admin</div>
        <div style={{display:"flex",gap:8}}>
          <input style={inp} type="password" placeholder="Nueva contraseña" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)}/>
          <button style={btn()} onClick={handleChangePass}>Cambiar</button>
        </div>
      </div>

      {/* Participantes */}
      <div style={card}>
        <div style={sec}>Participantes ({participants.length})</div>
        {participants.length===0
          ?<div style={{color:"#555",fontSize:13}}>Aún no hay participantes.</div>
          :participants.map(p=>{
            const pr=ranking.find(r=>r.id===p.id);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",gap:8}}>
                {editingName===p.id?(
                  <div style={{display:"flex",gap:6,flex:1,alignItems:"center"}}>
                    <input style={{...inp,flex:1,padding:"4px 8px",fontSize:13}} value={newNameInput}
                      onChange={e=>setNewNameInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"){handleRenameParticipant(p.id,newNameInput);setEditingName(null);}}}
                      autoFocus/>
                    <button onClick={()=>{handleRenameParticipant(p.id,newNameInput);setEditingName(null);}}
                      style={{background:"#1b7f4a",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>✓</button>
                    <button onClick={()=>setEditingName(null)}
                      style={{background:"#333",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
                  </div>
                ):(
                  <>
                    <span style={{fontWeight:600,flex:1}}>{p.name}</span>
                    <span style={{color:C.red,fontWeight:700,minWidth:50,textAlign:"right"}}>{pr?.total??0} pts</span>
                    <button onClick={()=>{setEditingName(p.id);setNewNameInput(p.name);}}
                      style={{background:"transparent",border:"1px solid #444",color:"#888",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>✏️</button>
                    {confirmDelete===p.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:12,color:"#f87171"}}>¿Eliminar?</span>
                        <button onClick={()=>{handleDeleteParticipant(p.id);setConfirmDelete(null);}}
                          style={{background:"#7f1b1b",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Sí</button>
                        <button onClick={()=>setConfirmDelete(null)}
                          style={{background:"#333",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>No</button>
                      </div>
                    ):(
                      <button onClick={()=>setConfirmDelete(p.id)}
                        style={{background:"transparent",border:"1px solid #444",color:"#888",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>🗑️</button>
                    )}
                  </>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

// ─── PARTICIPANT ──────────────────────────────────────────────────────────────

const ParticipantScreen = ({activeParticipant,openJornadas,results,currentPreds,handlePredChange,savePredictions,savedMsg,ranking,activeParticipantId,earnedBadges,coins}) => {
  if (!activeParticipant) return null;
  const [savedJ,setSavedJ]=useState(null);
  const openJs=Object.entries(openJornadas).filter(([,v])=>v).map(([k])=>Number(k));
  const available=ALL_MATCHES.filter(m=>openJs.includes(m.jornada));
  const dateLabelRange={1:"11–17 Jun",2:"18–23 Jun",3:"24–27 Jun"};
  const myBadges=earnedBadges.filter(b=>b.participant_id===activeParticipantId);
  const myCoins=coins.find(c=>c.participant_id===activeParticipantId)?.total||0;

  const handleSave=async(j)=>{ await savePredictions(); setSavedJ(j); setTimeout(()=>setSavedJ(null),3000); };

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:900}}>Hola, <span style={{color:C.red}}>{activeParticipant.name}</span></div>
          <div style={{fontSize:12,color:"#888"}}>
            {openJs.length>0?`Jornada(s) disponible(s): ${openJs.map(j=>"J"+j).join(", ")}`:"No hay jornadas abiertas."}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Flash msg={savedMsg}/>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <div style={{...card,flex:1,padding:"12px",textAlign:"center",marginBottom:0}}>
          <div style={{fontSize:20,fontWeight:900,color:C.red}}>{ranking.find(r=>r.id===activeParticipantId)?.total||0}</div>
          <div style={{fontSize:11,color:"#888"}}>pts totales</div>
        </div>
        <div style={{...card,flex:1,padding:"12px",textAlign:"center",marginBottom:0}}>
          <div style={{fontSize:20,fontWeight:900,color:"#fbbf24"}}>{myCoins>=0?`+${myCoins}`:myCoins}</div>
          <div style={{fontSize:11,color:"#888"}}>FIFA Coins 🪙</div>
        </div>
        <div style={{...card,flex:1,padding:"12px",textAlign:"center",marginBottom:0}}>
          <div style={{fontSize:20,fontWeight:900,color:"#4ade80"}}>{myBadges.length}</div>
          <div style={{fontSize:11,color:"#888"}}>badges</div>
        </div>
      </div>

      {/* Badges */}
      {myBadges.length>0&&(
        <div style={{...card,padding:"12px 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Mis Badges</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(myBadges.reduce((acc,b)=>{acc[b.badge_key]=(acc[b.badge_key]||0)+1;return acc;},{})).map(([key,count])=>{
              const def=BADGE_DEFS[key];
              if(!def) return null;
              return (
                <div key={key} title={`${def.name}: ${def.desc}`}
                  style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"4px 8px",textAlign:"center",fontSize:18}}>
                  {def.emoji}{count>1&&<sup style={{fontSize:10,color:C.red}}>x{count}</sup>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {available.length===0?(
        <div style={{...card,textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>🔒</div>
          <div style={{color:"#888"}}>No hay jornadas abiertas. El admin las abrirá cuando sea momento.</div>
        </div>
      ):(
        [1,2,3].map(j=>{
          if(!openJornadas[j]) return null;
          const jMatches=available.filter(m=>m.jornada===j);
          const byDate=jMatches.reduce((acc,m)=>{if(!acc[m.date])acc[m.date]=[];acc[m.date].push(m);return acc;},{});
          return (
            <div key={j} style={card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={sec}>Jornada {j} <span style={{color:"#555",fontSize:11,letterSpacing:0}}>· {dateLabelRange[j]}</span></div>
                <button style={{...btn(savedJ===j?"success":"primary"),padding:"6px 14px",fontSize:13,transition:"all .3s",minWidth:100}}
                  onClick={()=>handleSave(j)}>
                  {savedJ===j?"✅ Guardado":`Guardar J${j}`}
                </button>
              </div>
              {Object.entries(byDate).map(([date,matches])=>(
                <div key={date}>
                  <DateHeader dateStr={date}/>
                  {matches.map(m=>{
                    const pred=currentPreds[m.id]||{};
                    const r=results[m.id];
                    const done=r&&r.homeGoals!=null&&r.awayGoals!=null;
                    const pts=done?calcScore(pred,r):null;
                    return (
                      <div key={m.id} style={row}>
                        <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                          <span style={pill("#0f2d6e")}>G{m.group}</span>
                          <span style={{fontSize:11,color:"#666"}}>{m.time}</span>
                        </div>
                        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                          <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52,textAlign:"right"}}>{FLAGS[m.home]||"🏳️"} {ABBR[m.home]||m.home}</span>
                          <ScoreInput value={pred.home} onChange={v=>handlePredChange(m.id,"home",v)} disabled={done}/>
                          <span style={{color:"#555",fontSize:12}}>-</span>
                          <ScoreInput value={pred.away} onChange={v=>handlePredChange(m.id,"away",v)} disabled={done}/>
                          <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52}}>{ABBR[m.away]||m.away} {FLAGS[m.away]||"🏳️"}</span>
                          {done&&pts!==null&&(
                            <span style={{...pill(pts===3?"#1b7f4a":pts===0?"#7f1b1b":"#7f5a00"),minWidth:36,textAlign:"center"}}>
                              {pts}pt{pts!==1?"s":""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

// ─── RANKING ──────────────────────────────────────────────────────────────────

const RankingScreen = ({ranking,results,participants,openJornadas,earnedBadges,coins}) => {
  const medals=["🥇","🥈","🥉"];
  const maxPts=ranking[0]?.total||1;
  const jugados=Object.values(results).filter(r=>r.homeGoals!=null).length;

  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>🏆 Tabla <span style={{color:C.red}}>General</span></div>
      <div style={{fontSize:12,color:"#888",marginBottom:20}}>1pt ganador/empate · 1pt goles local · 1pt goles visitante</div>

      {ranking.length===0?(
        <div style={{...card,textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>👥</div>
          <div style={{color:"#888"}}>Aún no hay participantes ni resultados.</div>
        </div>
      ):ranking.map((p,i)=>{
        const pBadges=earnedBadges.filter(b=>b.participant_id===p.id);
        const badgeCounts=pBadges.reduce((acc,b)=>{acc[b.badge_key]=(acc[b.badge_key]||0)+1;return acc;},{});
        const pCoins=coins.find(c=>c.participant_id===p.id)?.total||0;
        return (
          <div key={p.id} style={{...card,padding:"14px 18px",
            background:i===0?"rgba(233,69,96,0.08)":C.card,
            border:`1px solid ${i===0?"rgba(233,69,96,0.4)":C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:i<3?26:18,fontWeight:900,minWidth:36,textAlign:"center",color:i>=3?"#555":undefined}}>
                {i<3?medals[i]:`#${i+1}`}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontWeight:700,fontSize:16}}>{p.name}</span>
                  {(()=>{
                    // Calc prev jornada ranking (exclude latest jornada)
                    const latestJ = Math.max(...[1,2,3].filter(j=>ALL_MATCHES.some(m=>m.jornada===j&&results[m.id]?.homeGoals!=null)));
                    if(!latestJ||latestJ===0) return null;
                    const prevRanking=[...ranking].map(pp=>{
                      let prevPts=0;
                      ALL_MATCHES.forEach(m=>{
                        if(m.jornada>=latestJ) return;
                        const r=results[m.id];
                        const pred=(pp.predictions||{})[m.id];
                        if(r&&r.homeGoals!=null&&pred){const pts=calcScore(pred,r);if(pts!=null)prevPts+=pts;}
                      });
                      return {...pp,prevPts};
                    }).sort((a,b)=>b.prevPts-a.prevPts);
                    const prevPos=prevRanking.findIndex(pp=>pp.id===p.id)+1;
                    const currPos=i+1;
                    const diff=prevPos-currPos;
                    if(diff>0) return <span style={{color:"#4ade80",fontSize:13,fontWeight:700}}>▲{diff}</span>;
                    if(diff<0) return <span style={{color:"#f87171",fontSize:13,fontWeight:700}}>▼{Math.abs(diff)}</span>;
                    return <span style={{color:"#555",fontSize:13}}>—</span>;
                  })()}
                </div>
                <div style={{marginTop:6,background:"rgba(255,255,255,0.06)",borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((p.total/maxPts)*100)}%`,background:i===0?C.red:C.blue,borderRadius:4}}/>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:900,color:i===0?C.red:"#e8e8f0"}}>
                  {p.total}<span style={{fontSize:12,color:"#888",fontWeight:400}}> pts</span>
                </div>
                <div style={{fontSize:12,color:"#fbbf24",fontWeight:700}}>{pCoins>=0?`+${pCoins}`:pCoins} 🪙</div>
              </div>
            </div>

            {/* Badges */}
            {Object.keys(badgeCounts).length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:10}}>
                {Object.entries(badgeCounts).map(([key,count])=>{
                  const def=BADGE_DEFS[key];
                  if(!def) return null;
                  return (
                    <span key={key} title={`${def.name}: ${def.desc}`}
                      style={{fontSize:16,cursor:"default"}} >
                      {def.emoji}{count>1&&<sup style={{fontSize:9,color:C.red}}>x{count}</sup>}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Desglose por jornada */}
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              {[1,2,3].map(j=>{
                const jPts=ALL_MATCHES.filter(m=>m.jornada===j).reduce((acc,m)=>{
                  const r=results[m.id]; const pred=(p.predictions||{})[m.id];
                  if(r&&r.homeGoals!=null&&pred){const pts=calcScore(pred,r);if(pts!=null)acc+=pts;}
                  return acc;
                },0);
                const jPlayed=ALL_MATCHES.filter(m=>m.jornada===j&&results[m.id]?.homeGoals!=null&&(p.predictions||{})[m.id]).length;
                return (
                  <div key={j} style={{background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"4px 10px",textAlign:"center",minWidth:70}}>
                    <div style={{fontSize:10,color:"#666",fontWeight:700}}>J{j}</div>
                    <div style={{fontSize:15,fontWeight:800,color:jPlayed>0?C.red:"#444"}}>{jPts}</div>
                    <div style={{fontSize:9,color:"#555"}}>{jPlayed} partidos</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{...card,marginTop:8}}>
        <div style={sec}>Estado del Torneo</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[
            {label:"Partidos jugados",value:`${jugados}/72`},
            {label:"Participantes",value:participants.length},
            {label:"Jornadas abiertas",value:`${Object.values(openJornadas).filter(Boolean).length}/3`},
          ].map(s=>(
            <div key={s.label} style={{flex:1,textAlign:"center",minWidth:100}}>
              <div style={{fontSize:24,fontWeight:900,color:C.red}}>{s.value}</div>
              <div style={{fontSize:11,color:"#888"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PRONÓSTICOS ──────────────────────────────────────────────────────────────

const PronosticosScreen = ({participants,results}) => {
  const [jFilter,setJFilter]=useState(1);
  const [gFilter,setGFilter]=useState("Todos");
  const groups=[...new Set(ALL_MATCHES.map(m=>m.group))];
  const jMatches=ALL_MATCHES.filter(m=>m.jornada===jFilter&&(gFilter==="Todos"||m.group===gFilter));
  const byDate=jMatches.reduce((acc,m)=>{if(!acc[m.date])acc[m.date]=[];acc[m.date].push(m);return acc;},{});

  return (
    <div style={{maxWidth:760,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>📋 Pronósticos <span style={{color:C.red}}>de Todos</span></div>
      <div style={{fontSize:12,color:"#888",marginBottom:16}}>Pronósticos de todos los participantes</div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[1,2,3].map(j=>(
          <button key={j} style={{...btn(jFilter===j?"primary":"outline"),padding:"8px 16px",fontSize:13}} onClick={()=>setJFilter(j)}>
            Jornada {j}
          </button>
        ))}
        <select style={{...inp,width:"auto"}} value={gFilter} onChange={e=>setGFilter(e.target.value)}>
          <option value="Todos">Todos los grupos</option>
          {groups.map(g=><option key={g} value={g}>Grupo {g}</option>)}
        </select>
      </div>
      {Object.entries(byDate).map(([date,matches])=>(
        <div key={date}>
          <DateHeader dateStr={date}/>
          {matches.map(m=>{
            const r=results[m.id]||{};
            const hasResult=r.homeGoals!=null&&r.awayGoals!=null;
            return (
              <div key={m.id} style={{...card,padding:"12px 16px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  <span style={pill("#0f2d6e")}>G{m.group}</span>
                  <span style={{fontSize:12,color:"#666"}}>{m.time}</span>
                  <span style={{flex:1,textAlign:"center",fontWeight:700,fontSize:14}}>
                    {FLAGS[m.home]||"🏳️"} {ABBR[m.home]} {hasResult?`${r.homeGoals} - ${r.awayGoals}`:"vs"} {ABBR[m.away]} {FLAGS[m.away]||"🏳️"}
                  </span>
                  {hasResult&&<span style={{...pill("#1b7f4a"),fontSize:11}}>Final</span>}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {participants.map(p=>{
                    const pred=(p.predictions||{})[m.id];
                    const pts=hasResult&&pred?calcScore(pred,r):null;
                    const hasPred=pred&&pred.home!=null&&pred.away!=null;
                    return (
                      <div key={p.id} style={{
                        background:pts===3?"rgba(27,127,74,0.2)":pts===0&&hasResult?"rgba(127,27,27,0.2)":"rgba(255,255,255,0.05)",
                        border:`1px solid ${pts===3?"#1b7f4a":pts===0&&hasResult?"#7f1b1b":"#333"}`,
                        borderRadius:8,padding:"6px 10px",minWidth:80,textAlign:"center"
                      }}>
                        <div style={{fontSize:11,color:"#888",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:80}}>{p.name}</div>
                        <div style={{fontWeight:700,fontSize:14}}>
                          {hasPred?`${pred.home}-${pred.away}`:<span style={{color:"#555"}}>—</span>}
                        </div>
                        {pts!==null&&(
                          <div style={{fontSize:10,color:pts===3?"#4ade80":pts===0?"#f87171":"#fbbf24",fontWeight:700,marginTop:2}}>
                            {pts}pt{pts!==1?"s":""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function QuinielaMundial() {
  const [screen,setScreen]=useState("home");
  const [adminAuth,setAdminAuth]=useState(false);
  const [adminPass,setAdminPass]=useState("admin123");
  const [passInput,setPassInput]=useState("");
  const [passError,setPassError]=useState(false);
  const [participantName,setParticipantName]=useState("");
  const [newAdminPass,setNewAdminPass]=useState("");

  const [results,setResults]=useState({});
  const [participants,setParticipants]=useState([]);
  const [openJornadas,setOpenJornadas]=useState({1:false,2:false,3:false});
  const [earnedBadges,setEarnedBadges]=useState([]);
  const [coins,setCoins]=useState([]);
  const [scorers,setScorers]=useState([]);
  const [quizOpenDates,setQuizOpenDates]=useState([]);
  const [loaded,setLoaded]=useState(false);

  const [activeParticipantId,setActiveParticipantId]=useState(null);
  const [currentPreds,setCurrentPreds]=useState({});
  const [savedMsg,setSavedMsg]=useState("");
  const [modal,setModal]=useState(null);

  useEffect(()=>{
    Promise.all([db.getConfig(),db.getParticipants(),db.getResults(),db.getBadges(),db.getCoins(),db.getScorers()])
      .then(([cfg,parts,res,badges,coinsData,scorersData])=>{
        if(cfg.open_jornadas) setOpenJornadas(cfg.open_jornadas);
        if(cfg.admin_pass) setAdminPass(cfg.admin_pass);
        if(cfg.quiz_open_dates) setQuizOpenDates(cfg.quiz_open_dates);
        setParticipants(parts);
        setResults(res);
        setEarnedBadges(badges);
        setCoins(coinsData);
        setScorers(scorersData);
        setLoaded(true);
      }).catch(()=>setLoaded(true));
  },[]);

  useEffect(()=>{
    const interval=setInterval(async()=>{
      const [parts,res,badges,coinsData,scorersData,cfg]=await Promise.all([
        db.getParticipants(),db.getResults(),db.getBadges(),db.getCoins(),db.getScorers(),db.getConfig()
      ]);
      setParticipants(parts);
      setResults(res);
      setEarnedBadges(badges);
      setCoins(coinsData);
      setScorers(scorersData);
      if(cfg.quiz_open_dates) setQuizOpenDates(cfg.quiz_open_dates);
    },15000);
    return ()=>clearInterval(interval);
  },[]);

  const flash=(msg="✅ Guardado")=>{setSavedMsg(msg);setTimeout(()=>setSavedMsg(""),2500);};

  const handleAdminLogin=useCallback(()=>{
    if(passInput===adminPass){setAdminAuth(true);setPassError(false);setScreen("admin");setPassInput("");}
    else setPassError(true);
  },[passInput,adminPass]);

  const handleResultChange=useCallback(async(matchId,field,val)=>{
    setResults(prev=>{
      const r=prev[matchId]||{};
      const updated={...r,[field]:val};
      const nr={...prev,[matchId]:updated};
      db.upsertResult(matchId,nr[matchId].homeGoals??null,nr[matchId].awayGoals??null);
      return nr;
    });
  },[]);

  const toggleJornada=useCallback(async(j)=>{
    const newOJ={...openJornadas,[j]:!openJornadas[j]};
    setOpenJornadas(newOJ);
    await db.setConfig("open_jornadas",newOJ);
    flash(newOJ[j]?`✅ Jornada ${j} abierta`:`🔒 Jornada ${j} cerrada`);
  },[openJornadas]);

  const handleChangePass=useCallback(async()=>{
    if(!newAdminPass.trim()) return;
    setAdminPass(newAdminPass);
    await db.setConfig("admin_pass",newAdminPass);
    setNewAdminPass("");
    flash("✅ Contraseña actualizada");
  },[newAdminPass]);

  const handleSelectParticipant=useCallback((p)=>{
    setModal({type:"login",participant:p});
  },[]);

  const handleNewParticipant=useCallback(()=>{
    const name=participantName.trim();
    if(!name) return;
    if(participants.find(p=>p.name.toLowerCase()===name.toLowerCase())){flash("⚠️ Ese nombre ya existe");return;}
    setModal({type:"new",participant:{name}});
  },[participantName,participants]);

  const handleNewWithPassword=useCallback(async(password)=>{
    const name=participantName.trim();
    const np={id:Date.now(),name,predictions:{},password};
    await db.upsertParticipant(np);
    const updated=[...participants,np];
    setParticipants(updated);
    setParticipantName("");
    setModal(null);
    setActiveParticipantId(np.id);
    setCurrentPreds({});
    setScreen("participant");
  },[participantName,participants]);

  const handleDeleteParticipant=useCallback(async(id)=>{
    await db.deleteParticipant(id);
    setParticipants(prev=>prev.filter(p=>p.id!==id));
    flash("🗑️ Participante eliminado");
  },[]);

  const handlePredChange=useCallback((matchId,field,val)=>{
    setCurrentPreds(prev=>({...prev,[matchId]:{...(prev[matchId]||{}),[field]:val}}));
  },[]);

  const savePredictions=useCallback(async()=>{
    setParticipants(prev=>{
      const nps=prev.map(p=>p.id===activeParticipantId?{...p,predictions:{...currentPreds}}:p);
      const me=nps.find(p=>p.id===activeParticipantId);
      if(me) db.upsertParticipant(me);
      return nps;
    });
    flash("✅ Quiniela guardada");
  },[activeParticipantId,currentPreds]);

  // Calculate badges for a jornada
  const handleCalcBadges=useCallback(async(jornada)=>{
    flash("⏳ Calculando badges...");
    // Delete existing badges for this jornada first
    await db.deleteBadgesByJornada(jornada);
    // Calculate new badges
    const awarded=calcBadgesForJornada(jornada,participants,results);
    // Insert all badges
    for(const {participantId,badgeKey} of awarded){
      await db.insertBadge(participantId,badgeKey,jornada);
    }
    // Calculate coins per participant
    const allBadges=await db.getBadges();
    setEarnedBadges(allBadges);
    // Recalc coins for all participants
    for(const p of participants){
      const pBadgeKeys=allBadges.filter(b=>b.participant_id===p.id).map(b=>b.badge_key);
      const quizCoins=coins.find(c=>c.participant_id===p.id)?.quiz_coins||0;
      const total=calcCoinsFromBadges(pBadgeKeys)+quizCoins;
      await db.upsertCoins(p.id,total);
    }
    const newCoins=await db.getCoins();
    setCoins(newCoins);
    flash(`✅ Badges de Jornada ${jornada} calculados`);
  },[participants,results,coins]);

  // Quiz open/close
  const handleQuizToggle=useCallback(async(label)=>{
    const updated=quizOpenDates.includes(label)
      ? quizOpenDates.filter(d=>d!==label)
      : [...quizOpenDates, label];
    setQuizOpenDates(updated);
    await db.setQuizOpenDates(updated);
    flash(updated.includes(label)?`✅ Quiz ${label} abierto`:`🔒 Quiz ${label} cerrado`);
  },[quizOpenDates]);

  // Rename participant
  const handleRenameParticipant=useCallback(async(id, newName)=>{
    if(!newName.trim()) return;
    if(participants.find(p=>p.name.toLowerCase()===newName.toLowerCase()&&p.id!==id)){
      flash("⚠️ Ese nombre ya existe");
      return;
    }
    await db.updateParticipantName(id, newName.trim());
    setParticipants(prev=>prev.map(p=>p.id===id?{...p,name:newName.trim()}:p));
    flash("✅ Nombre actualizado");
  },[participants]);

  // Quiz save
  const handleSaveQuizAnswers=useCallback(async(answers,coinsEarned,label)=>{
    if(!activeParticipantId) return;
    const today=new Date();
    const date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const quizLabel=label||date;
    for(const ans of answers){
      await db.insertQuizAnswer(activeParticipantId,ans.questionId,date,ans.selectedIndex,ans.isCorrect,ans.coinsEarned,quizLabel);
    }
    // Add quiz coins
    const current=coins.find(c=>c.participant_id===activeParticipantId)?.total||0;
    await db.upsertCoins(activeParticipantId,current+coinsEarned);
    const newCoins=await db.getCoins();
    setCoins(newCoins);
  },[activeParticipantId,coins]);

  // Scorers
  const handleUpsertScorer=useCallback(async(scorer)=>{
    await db.upsertScorer(scorer);
    const updated=await db.getScorers();
    setScorers(updated);
  },[]);

  const handleDeleteScorer=useCallback(async(id)=>{
    await db.deleteScorer(id);
    setScorers(prev=>prev.filter(s=>s.id!==id));
  },[]);

  const ranking=participants.map(p=>{
    let total=0,played=0;
    ALL_MATCHES.forEach(m=>{
      const r=results[m.id];
      const pred=(p.predictions||{})[m.id];
      if(r&&r.homeGoals!=null&&pred){
        const pts=calcScore(pred,r);
        if(pts!=null){total+=pts;played++;}
      }
    });
    return {...p,total,played};
  }).sort((a,b)=>b.total-a.total);

  const activeParticipant=participants.find(p=>p.id===activeParticipantId);

  if(!loaded) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>⚽</div>
      <div style={{color:C.red,fontSize:18,fontWeight:700}}>Cargando quiniela…</div>
    </div>
  );

  const navBtn=(active)=>({
    background:active?C.red:"transparent",
    border:`1px solid ${active?C.red:"#333"}`,
    color:active?"#fff":"#aaa",
    borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",
  });

  const screens = {
    home: <HomeScreen participants={participants} adminAuth={adminAuth} participantName={participantName} setParticipantName={setParticipantName} passInput={passInput} setPassInput={setPassInput} passError={passError} handleNewParticipant={handleNewParticipant} handleAdminLogin={handleAdminLogin} handleSelectParticipant={handleSelectParticipant} setScreen={setScreen} openJornadas={openJornadas}/>,
    admin: <AdminScreen participants={participants} results={results} openJornadas={openJornadas} savedMsg={savedMsg} handleResultChange={handleResultChange} toggleJornada={toggleJornada} newAdminPass={newAdminPass} setNewAdminPass={setNewAdminPass} handleChangePass={handleChangePass} ranking={ranking} handleDeleteParticipant={handleDeleteParticipant} handleCalcBadges={handleCalcBadges} quizOpenDates={quizOpenDates} handleQuizToggle={handleQuizToggle} handleRenameParticipant={handleRenameParticipant}/>,
    participant: <ParticipantScreen activeParticipant={activeParticipant} openJornadas={openJornadas} results={results} currentPreds={currentPreds} handlePredChange={handlePredChange} savePredictions={savePredictions} savedMsg={savedMsg} ranking={ranking} activeParticipantId={activeParticipantId} earnedBadges={earnedBadges} coins={coins}/>,
    ranking: <RankingScreen ranking={ranking} results={results} participants={participants} openJornadas={openJornadas} earnedBadges={earnedBadges} coins={coins}/>,
    pronosticos: <PronosticosScreen participants={participants} results={results}/>,
    badges: <BadgesScreen participants={participants} earnedBadges={earnedBadges}/>,
    mundial: <MundialScreen results={results} scorers={scorers} onUpsertScorer={handleUpsertScorer} onDeleteScorer={handleDeleteScorer} isAdmin={adminAuth}/>,
    tendencias: <TendenciasScreen participants={participants} results={results} openJornadas={openJornadas}/>,
    quiz: <QuizScreen participant={activeParticipant} openQuizDates={quizOpenDates} onSaveAnswers={handleSaveQuizAnswers}/>,
    perfil: <ProfileScreen participant={activeParticipant} results={results} earnedBadges={earnedBadges} coins={coins}/>,
    stats: <StatsScreen participants={participants} results={results}/>,
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.bg} 0%,#0f1932 50%,${C.bg} 100%)`,fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e8e8f0"}}>

      {modal&&(
        modal.type==="new"?(
          <PasswordModal participant={modal.participant} isNew={true}
            onSuccess={handleNewWithPassword} onCancel={()=>setModal(null)}/>
        ):(
          <PasswordModal participant={modal.participant} isNew={false}
            onSuccess={()=>{setModal(null);const p=participants.find(x=>x.id===modal.participant.id);if(p){setActiveParticipantId(p.id);setCurrentPreds({...(p.predictions||{})});setScreen("participant");}}}
            onCancel={()=>setModal(null)}/>
        )
      )}

      {/* NAV */}
      <div style={{background:"linear-gradient(90deg,#0f1932,#1a0a2e)",borderBottom:`2px solid ${C.red}`,padding:"10px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>⚽ <span style={{color:C.red}}>QUINIELA</span> 2026</div>
          <button style={navBtn(screen==="home")} onClick={()=>setScreen("home")}>Inicio</button>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {activeParticipant&&<button style={navBtn(screen==="participant")} onClick={()=>setScreen("participant")}>Mi Quiniela</button>}
          {activeParticipant&&<button style={navBtn(screen==="perfil")} onClick={()=>setScreen("perfil")}>👤 Perfil</button>}
          <button style={navBtn(screen==="ranking")} onClick={()=>setScreen("ranking")}>🏆 Ranking</button>
          <button style={navBtn(screen==="pronosticos")} onClick={()=>setScreen("pronosticos")}>📋 Pronósticos</button>
          <button style={navBtn(screen==="badges")} onClick={()=>setScreen("badges")}>🏅 Badges</button>
          <button style={navBtn(screen==="mundial")} onClick={()=>setScreen("mundial")}>🌎 Mundial</button>
          <button style={navBtn(screen==="tendencias")} onClick={()=>setScreen("tendencias")}>🔮 Tendencias</button>
          <button style={navBtn(screen==="quiz")} onClick={()=>setScreen("quiz")}>🧠 Quiz</button>
          {adminAuth&&<button style={navBtn(screen==="admin")} onClick={()=>setScreen("admin")}>⚙️ Admin</button>}
        </div>
      </div>

      {screens[screen] || screens.home}
    </div>
  );
}
