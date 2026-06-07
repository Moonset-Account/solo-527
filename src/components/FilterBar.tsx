import { useFilterStore } from "@/stores/filterStore"
import { Filter, X, RotateCcw } from "lucide-react"

const SHIFTS = ["早班", "中班", "晚班"]
const SLOTS = Array.from({ length: 60 }, (_, i) => {
  const row = String.fromCharCode(65 + Math.floor(i / 12))
  const num = String((i % 12) + 1).padStart(2, "0")
  return { id: `${row}${num}`, label: `格口${row}${num}` }
})
const ROUTES = ["北京线路", "上海线路", "广州线路", "成都线路", "武汉线路", "西安线路", "杭州线路", "深圳线路"]
const DEVICES = ["分拣机1", "分拣机2", "分拣机3", "分拣机4", "分拣机5", "分拣机6"]

export default function FilterBar() {
  const store = useFilterStore()
  const activeFilters = [store.shift, store.slot, store.route, store.device].filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <Filter size={14} />
        <span className="font-medium">筛选</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={store.dateStart.slice(0, 10)}
          onChange={(e) => store.setDateStart(e.target.value + "T00:00:00")}
          className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
        />
        <span className="text-zinc-500 text-xs">至</span>
        <input
          type="date"
          value={store.dateEnd.slice(0, 10)}
          onChange={(e) => store.setDateEnd(e.target.value + "T23:59:59")}
          className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
        />
      </div>

      <select
        value={store.shift}
        onChange={(e) => store.setShift(e.target.value)}
        className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
      >
        <option value="">全部班组</option>
        {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={store.slot}
        onChange={(e) => store.setSlot(e.target.value)}
        className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
      >
        <option value="">全部格口</option>
        {SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>

      <select
        value={store.route}
        onChange={(e) => store.setRoute(e.target.value)}
        className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
      >
        <option value="">全部线路</option>
        {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <select
        value={store.device}
        onChange={(e) => store.setDevice(e.target.value)}
        className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
      >
        <option value="">全部设备</option>
        {DEVICES.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <div className="flex items-center gap-2">
        <select
          value={store.granularity}
          onChange={(e) => store.setGranularity(e.target.value as "hour" | "day")}
          className="bg-[#151930] border border-[#2a3050] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-info/50"
        >
          <option value="hour">小时</option>
          <option value="day">天</option>
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5">
          {store.shift && (
            <span className="inline-flex items-center gap-1 bg-blue-info/10 text-blue-info text-xs px-2 py-1 rounded-md">
              {store.shift}
              <X size={10} className="cursor-pointer" onClick={() => store.setShift("")} />
            </span>
          )}
          {store.slot && (
            <span className="inline-flex items-center gap-1 bg-blue-info/10 text-blue-info text-xs px-2 py-1 rounded-md">
              格口{store.slot}
              <X size={10} className="cursor-pointer" onClick={() => store.setSlot("")} />
            </span>
          )}
          {store.route && (
            <span className="inline-flex items-center gap-1 bg-blue-info/10 text-blue-info text-xs px-2 py-1 rounded-md">
              {store.route}
              <X size={10} className="cursor-pointer" onClick={() => store.setRoute("")} />
            </span>
          )}
          {store.device && (
            <span className="inline-flex items-center gap-1 bg-blue-info/10 text-blue-info text-xs px-2 py-1 rounded-md">
              {store.device}
              <X size={10} className="cursor-pointer" onClick={() => store.setDevice("")} />
            </span>
          )}
          <button
            onClick={store.resetFilters}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            <RotateCcw size={10} />
            重置
          </button>
        </div>
      )}
    </div>
  )
}
