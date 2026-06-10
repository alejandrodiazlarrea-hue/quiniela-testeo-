import { useState, useEffect } from "react";
import { JORNADA_CLOSE } from "../data/matches.js";

export const C = {
  red:"#e94560", bg:"#0d0d1a", card:"rgba(255,255,255,0.04)",
  border:"rgba(233,69,96,0.2)", blue:"#0f3460", green:"#1b7f4a",
};

export const inp = {
  background:C.blue, border:"1px solid #444", borderRadius:8,
  color:"#fff", padding:"10px 14px", fontSize:15, outline:"none",
  width:"100%", boxSizing:"border-box",
};

export const card = {
  background:C.card, border:`1px solid ${C.border}`,
  borderRadius:12, padding:20, marginBottom:16,
};

export const sec = {
  fontSize:13, fontWeight:700, textTransform:"uppercase",
  letterSpacing:2, color:C.red, marginBottom:12,
};

export const row = {
  display:"flex", alignItems:"center", padding:"8px 0",
  borderBottom:"1px solid rgba(255,255,255,0.06)",
  gap:6, flexWrap:"nowrap", overflowX:"auto",
};

export const btn = (v="primary") => ({
  background: v==="primary"?C.red : v==="success"?C.green : v==="gray"?"#333" : "transparent",
  border: v==="outline"?`1px solid ${C.red}` : v==="outline-gray"?"1px solid #444" : "none",
  color: v==="outline"?C.red : v==="outline-gray"?"#aaa" : "#fff",
  borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:14, fontWeight:700,
});

export const pill = (color) => ({
  background:color||"#1a1a2e", borderRadius:20, padding:"2px 8px",
  fontSize:11, fontWeight:700, color:"#fff", display:"inline-block", whiteSpace:"nowrap",
});

export const ScoreInput = ({value, onChange, disabled}) => (
  <input type="number" min="0" max="20"
    value={value==null?"":value}
    onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}
    disabled={disabled}
    style={{
      width:44, textAlign:"center",
      background:disabled?"#1a1a2e":C.blue,
      border:`1px solid ${C.red}`, borderRadius:6,
      color:"#fff", fontSize:18, fontWeight:700, padding:"4px 0", outline:"none",
    }}
  />
);

export const DateHeader = ({dateStr}) => {
  const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const [y,m,d] = dateStr.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  const label = `${DAYS_ES[dt.getDay()]} ${d} ${MONTHS_ES[m-1]}`;
  return (
    <div style={{fontSize:12,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1,padding:"12px 0 4px",borderTop:"1px solid rgba(233,69,96,0.15)",marginTop:6}}>
      📅 {label}
    </div>
  );
};

export const Flash = ({msg}) => msg ? (
  <div style={{background:"rgba(27,127,74,0.2)",border:"1px solid #1b7f4a",color:"#4ade80",borderRadius:6,padding:"3px 12px",fontSize:12,fontWeight:700}}>{msg}</div>
) : null;

export const useCountdown = (target) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(""); return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setTimeLeft(d>0?`${d}d ${h}h ${m}m`:`${h}h ${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc,1000);
    return ()=>clearInterval(t);
  },[target]);
  return timeLeft;
};

export const CountdownBanner = ({openJornadas}) => {
  const nextJ = [1,2,3].find(j => openJornadas[j]);
  const t1 = useCountdown(JORNADA_CLOSE[1]);
  const t2 = useCountdown(JORNADA_CLOSE[2]);
  const t3 = useCountdown(JORNADA_CLOSE[3]);
  const timers = {1:t1,2:t2,3:t3};
  if (!nextJ) return null;
  const t = timers[nextJ];
  if (!t) return null;
  return (
    <div style={{background:"rgba(233,69,96,0.1)",border:`1px solid ${C.red}`,borderRadius:10,padding:"10px 16px",marginBottom:16,textAlign:"center"}}>
      <div style={{fontSize:12,color:"#888",marginBottom:2}}>⏱️ Jornada {nextJ} cierra en</div>
      <div style={{fontSize:22,fontWeight:900,color:C.red,fontVariantNumeric:"tabular-nums"}}>{t}</div>
      <div style={{fontSize:11,color:"#666",marginTop:2}}>Registra tus pronósticos antes de que cierre</div>
    </div>
  );
};

export const PasswordModal = ({participant, onSuccess, onCancel, isNew}) => {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (isNew) {
      if (!pass.trim()) { setError("Pon una contraseña"); return; }
      if (pass !== confirmPass) { setError("Las contraseñas no coinciden"); return; }
      onSuccess(pass);
    } else {
      if (pass === participant.password) onSuccess();
      else { setError("Contraseña incorrecta"); setPass(""); }
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{...card,width:320,margin:0,padding:28}}>
        <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>
          {isNew?"Crea tu contraseña":`Hola, ${participant.name}`}
        </div>
        <div style={{color:"#888",fontSize:13,marginBottom:20}}>
          {isNew?"Solo tú la sabrás. No se puede recuperar.":"Ingresa tu contraseña para continuar."}
        </div>
        <input style={{...inp,marginBottom:10}} type="password" placeholder="Contraseña"
          value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus />
        {isNew&&(
          <input style={{...inp,marginBottom:10}} type="password" placeholder="Confirmar contraseña"
            value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
        )}
        {error&&<div style={{color:C.red,fontSize:12,marginBottom:10}}>{error}</div>}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button style={{...btn("outline"),flex:1}} onClick={onCancel}>Cancelar</button>
          <button style={{...btn(),flex:1}} onClick={handleSubmit}>Entrar</button>
        </div>
      </div>
    </div>
  );
};
