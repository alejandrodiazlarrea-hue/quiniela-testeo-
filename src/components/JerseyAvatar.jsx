import { C } from "./ui.jsx";

// Jersey SVG verde México con número
export const JerseyAvatar = ({ number = 10, size = 60 }) => {
  const fontSize = size * 0.32;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Jersey body */}
      <path d="M25 35 L15 55 L30 58 L30 85 L70 85 L70 58 L85 55 L75 35 L62 42 Q50 48 38 42 Z" 
        fill="#006847" stroke="#004d33" strokeWidth="1.5"/>
      {/* Collar */}
      <path d="M38 42 Q44 50 50 50 Q56 50 62 42 Q56 38 50 37 Q44 38 38 42 Z" 
        fill="#004d33"/>
      {/* Sleeves highlight */}
      <path d="M25 35 L15 55 L30 58 L30 50 L22 42 Z" fill="#007a54" opacity="0.5"/>
      <path d="M75 35 L85 55 L70 58 L70 50 L78 42 Z" fill="#007a54" opacity="0.5"/>
      {/* Mexico badge area */}
      <circle cx="38" cy="58" r="6" fill="#004d33" opacity="0.5"/>
      {/* Number */}
      <text x="54" y="75" textAnchor="middle" fontSize={fontSize} fontWeight="900" 
        fill="white" fontFamily="Arial, sans-serif" letterSpacing="-1">{number}</text>
      {/* Shine */}
      <path d="M35 40 Q40 35 45 38" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round"/>
    </svg>
  );
};

// Selector de número
export const JerseyPicker = ({ value, onChange }) => {
  return (
    <div style={{ textAlign: "center" }}>
      <JerseyAvatar number={value || 10} size={80}/>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Tu número</div>
        <input
          type="number" min="1" max="99"
          value={value || 10}
          onChange={e => {
            const v = Math.min(99, Math.max(1, Number(e.target.value) || 10));
            onChange(v);
          }}
          style={{
            width: 70, textAlign: "center",
            background: "#0f3460", border: `1px solid ${C.red}`,
            borderRadius: 8, color: "#fff", fontSize: 24,
            fontWeight: 900, padding: "8px 0", outline: "none",
          }}
        />
      </div>
    </div>
  );
};
