import { Download, FileImage, FileText } from 'lucide-react'
import { useState } from 'react'
import { useFilterStore } from '@/store/filterStore'

interface ExportButtonProps {
  targetId: string
  fileName?: string
}

export default function ExportButton({ targetId, fileName = 'library-report' }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const filters = useFilterStore((s) => s.filters)

  const buildFilterTag = () => {
    const parts: string[] = []
    if (filters.collectionTypes.length) parts.push(`馆藏:${filters.collectionTypes.join(',')}`)
    if (filters.readerGroups.length) parts.push(`读者:${filters.readerGroups.join(',')}`)
    if (filters.themes.length) parts.push(`主题:${filters.themes.join(',')}`)
    if (filters.branches.length) parts.push(`分馆:${filters.branches.join(',')}`)
    parts.push(`${filters.dateRange.start}~${filters.dateRange.end}`)
    return `筛选: ${parts.join(' | ')}`
  }

  const handleExport = async (format: 'pdf' | 'png') => {
    setExporting(true)
    setOpen(false)
    try {
      const element = document.getElementById(targetId)
      if (!element) return

      const watermark = document.createElement('div')
      watermark.style.cssText = 'position:absolute;bottom:8px;right:12px;font-size:10px;color:#94a3b8;font-family:Source Sans 3,sans-serif;pointer-events:none;z-index:9999;'
      watermark.textContent = buildFilterTag()
      element.style.position = 'relative'
      element.appendChild(watermark)

      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAFBFC',
      })

      element.removeChild(watermark)

      if (format === 'png') {
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        const jsPDF = (await import('jspdf')).default
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        })
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save(`${fileName}.pdf`)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C5CE7] text-white text-xs font-medium hover:bg-[#5A4BD1] transition-colors disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        {exporting ? '导出中...' : '导出'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 w-full"
          >
            <FileText className="w-3.5 h-3.5 text-[#FF6B6B]" />
            导出 PDF
          </button>
          <button
            onClick={() => handleExport('png')}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 w-full"
          >
            <FileImage className="w-3.5 h-3.5 text-[#6C5CE7]" />
            导出 PNG
          </button>
        </div>
      )}
    </div>
  )
}
