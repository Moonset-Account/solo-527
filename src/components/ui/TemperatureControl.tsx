interface TemperatureControlProps {
  temperature: number;
  targetTemp?: number;
  tolerance?: number;
  onChange: (temp: number) => void;
  disabled?: boolean;
}

export default function TemperatureControl({ temperature, targetTemp, tolerance = 10, onChange, disabled }: TemperatureControlProps) {
  const isInRange = targetTemp ? Math.abs(temperature - targetTemp) <= tolerance : true;
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border backdrop-blur-sm transition-all ${
      isInRange ? 'bg-[#0a2e2e]/90 border-[#1a5a5a]' : 'bg-red-900/30 border-red-500/50'
    }`}>
      <span className="text-[10px] text-gray-400">温度控制</span>
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1a3a3a" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={isInRange ? '#F5C542' : '#e74c3c'}
            strokeWidth="8"
            strokeDasharray={`${(temperature / 100) * 251.3} 251.3`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${isInRange ? 'text-[#F5C542]' : 'text-red-400'}`}>{Math.round(temperature)}°</span>
          {targetTemp && <span className="text-[8px] text-gray-400">目标 {targetTemp}°C</span>}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={temperature}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-1 bg-[#1a3a3a] rounded-lg appearance-none cursor-pointer accent-[#F5C542]"
      />
      <div className="flex gap-1">
        <button onClick={() => onChange(Math.max(0, temperature - 5))} disabled={disabled} className="px-2 py-0.5 text-xs bg-[#0D4F4F] text-white rounded hover:bg-[#1a5a5a] disabled:opacity-30">-5°</button>
        <button onClick={() => onChange(Math.min(100, temperature + 5))} disabled={disabled} className="px-2 py-0.5 text-xs bg-[#0D4F4F] text-white rounded hover:bg-[#1a5a5a] disabled:opacity-30">+5°</button>
      </div>
    </div>
  );
}
