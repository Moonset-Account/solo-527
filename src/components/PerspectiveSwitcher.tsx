import { useFilterStore } from "@/stores/filterStore"
import type { Perspective } from "@/types"
import { Users, Grid3X3, Route, Cpu, Clock } from "lucide-react"

const perspectives: { key: Perspective; label: string; icon: typeof Users }[] = [
  { key: "shift", label: "班组", icon: Users },
  { key: "slot", label: "格口", icon: Grid3X3 },
  { key: "route", label: "线路", icon: Route },
  { key: "device", label: "设备", icon: Cpu },
  { key: "time", label: "时段", icon: Clock },
]

export default function PerspectiveSwitcher() {
  const { perspective, setPerspective } = useFilterStore()

  return (
    <div className="flex items-center gap-1 bg-[#151930] rounded-xl p-1 border border-[#2a3050]">
      {perspectives.map((p) => {
        const isActive = perspective === p.key
        return (
          <button
            key={p.key}
            onClick={() => setPerspective(p.key)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-blue-info/15 text-blue-info shadow-sm shadow-blue-info/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1e2440]"
              }
            `}
          >
            <p.icon size={15} />
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
