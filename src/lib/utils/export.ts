import type { WeeklyReport } from '$lib/types'

function toCSVRow(values: unknown[]): string {
  return values
    .map((v) => {
      const str = String(v ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    .join(',')
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const rows = data.map((row) => toCSVRow(headers.map((h) => row[h])))
  const csv = [toCSVRow(headers), ...rows].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`未找到ID为"${elementId}"的元素`)

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 210
  const pageHeight = 297
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = -(pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(heightLeft / pageHeight)))
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  pdf.save(finalName)
}

export async function exportToImage(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`未找到ID为"${elementId}"的元素`)

  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  const link = document.createElement('a')
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportWeeklyReportPDF(
  report: WeeklyReport,
  elementId: string
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`未找到ID为"${elementId}"的元素`)

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 210
  const pageHeight = 297
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')

  pdf.setFontSize(16)
  pdf.text(`SKU\u5468\u8F6C\u5206\u6790\u5468\u62A5`, 105, 15, { align: 'center' })
  pdf.setFontSize(10)
  pdf.text(`\u62A5\u544A\u5468\u671F: ${report.week_start} ~ ${report.week_end}`, 105, 22, { align: 'center' })
  pdf.text(`\u751F\u6210\u65F6\u95F4: ${report.generated_at}`, 105, 28, { align: 'center' })

  let heightLeft = imgHeight
  let position = 35
  const availableHeight = pageHeight - position

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= availableHeight

  while (heightLeft > 0) {
    pdf.addPage()
    position = -(pageHeight * (Math.ceil(imgHeight / availableHeight) - Math.ceil(heightLeft / availableHeight)))
    pdf.addImage(imgData, 'PNG', 0, position + 35, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  if (report.key_changes.length > 0) {
    const lastPage = pdf.getNumberOfPages()
    pdf.setPage(lastPage)
    const yOffset = Math.min(position + imgHeight + 10, pageHeight - 20)
    pdf.setFontSize(12)
    pdf.text('\u5173\u952E\u53D8\u5316', 10, yOffset)
    pdf.setFontSize(9)
    report.key_changes.forEach((change, i) => {
      pdf.text(`\u2022 ${change}`, 15, yOffset + 6 + i * 5)
    })
  }

  pdf.save(`${report.report_id}.pdf`)
}
