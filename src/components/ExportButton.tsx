import { useState } from "react"
import { createExport, getExportStatus, getExportDownloadUrl } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import { Download, Loader2, CheckCircle } from "lucide-react"

export default function ExportButton() {
  const filter = useFilterStore()
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [taskId, setTaskId] = useState("")

  const handleExport = async () => {
    setStatus("loading")
    try {
      const result = await createExport(filter, "summary")
      setTaskId(result.task_id)

      const poll = async () => {
        const task = await getExportStatus(result.task_id)
        if (task.status === "已完成" || task.status === "complete") {
          setStatus("done")
          window.open(getExportDownloadUrl(result.task_id), "_blank")
          setTimeout(() => setStatus("idle"), 3000)
        } else {
          setTimeout(poll, 1000)
        }
      }
      setTimeout(poll, 1000)
    } catch {
      setStatus("idle")
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={status === "loading"}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${status === "done"
          ? "bg-emerald-ok/10 text-emerald-ok border border-emerald-ok/20"
          : status === "loading"
            ? "bg-[#151930] text-zinc-400 border border-[#2a3050] cursor-wait"
            : "bg-blue-info/10 text-blue-info border border-blue-info/20 hover:bg-blue-info/20"
        }
      `}
    >
      {status === "loading" && <Loader2 size={14} className="animate-spin" />}
      {status === "done" && <CheckCircle size={14} />}
      {status === "idle" && <Download size={14} />}
      {status === "loading" ? "导出中..." : status === "done" ? "已下载" : "导出报表"}
    </button>
  )
}
