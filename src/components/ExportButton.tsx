import { Download } from 'lucide-react'
import { exportToCSV } from '@/utils/export'

interface ExportButtonProps {
  filename: string
  headers: string[]
  rows: (string | number)[][]
  label?: string
}

export default function ExportButton({ filename, headers, rows, label = '导出 CSV' }: ExportButtonProps) {
  const handleExport = () => {
    exportToCSV(filename, headers, rows)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2D4470] transition-colors"
    >
      <Download size={14} />
      {label}
    </button>
  )
}
