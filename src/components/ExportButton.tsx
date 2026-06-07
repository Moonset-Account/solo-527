import { Download } from 'lucide-react'
import { supersetClient } from '@/api/superset'
import { useState } from 'react'

interface ExportButtonProps {
  filename: string
  headers: string[]
  rows: (string | number)[][]
  label?: string
}

export default function ExportButton({ filename, headers, rows, label = '导出 CSV' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)

    const stringRows = rows.map((row) => row.map(String))
    const result = await supersetClient.exportCSV(filename, headers, stringRows)

    if (!result.success) {
      setError(result.error ?? '导出失败')
    }

    setExporting(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2D4470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={14} />
        {exporting ? '导出中...' : label}
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
