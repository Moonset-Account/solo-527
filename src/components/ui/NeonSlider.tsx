import { cn } from '@/lib/utils'

interface NeonSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
  color?: 'green' | 'orange'
}

const colorMap = {
  green: {
    track: '#00ff88',
    glow: 'rgba(0,255,136,0.5)',
    text: 'text-[#00ff88]',
  },
  orange: {
    track: '#ff8800',
    glow: 'rgba(255,136,0,0.5)',
    text: 'text-[#ff8800]',
  },
}

export default function NeonSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  color = 'green',
}: NeonSliderProps) {
  const cm = colorMap[color]
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">{label}</span>
        <span className={cn('text-sm font-semibold', cm.text)}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="neon-slider h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, ${cm.track} 0%, ${cm.track} ${percent}%, #2a2d3a ${percent}%, #2a2d3a 100%)`,
          boxShadow: `0 0 6px ${cm.glow}`,
        }}
      />
      <style>{`
        .neon-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${cm.track};
          box-shadow: 0 0 8px ${cm.glow};
          cursor: pointer;
        }
        .neon-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${cm.track};
          box-shadow: 0 0 8px ${cm.glow};
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
