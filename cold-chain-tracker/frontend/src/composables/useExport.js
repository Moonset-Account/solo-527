import { ref } from 'vue'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import api from '../utils/api'

export function useExport() {
  const exporting = ref(false)

  async function exportCSV(data, filename = 'export') {
    exporting.value = true
    try {
      const csv = Papa.unparse(data)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.csv`
      link.click()
      URL.revokeObjectURL(url)
      await api.post('/export', { type: 'csv', filename })
    } finally {
      exporting.value = false
    }
  }

  async function exportPDF(elementId, filename = 'export') {
    exporting.value = true
    try {
      const el = document.getElementById(elementId)
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      let imgW = pageW - 20
      let imgH = imgW / ratio
      if (imgH > pageH - 20) {
        imgH = pageH - 20
        imgW = imgH * ratio
      }
      pdf.addImage(imgData, 'PNG', 10, 10, imgW, imgH)
      pdf.save(`${filename}.pdf`)
      await api.post('/export', { type: 'pdf', filename })
    } finally {
      exporting.value = false
    }
  }

  async function exportScreenshot(elementId, filename = 'export') {
    exporting.value = true
    try {
      const el = document.getElementById(elementId)
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${filename}.png`
      link.click()
      await api.post('/export', { type: 'screenshot', filename })
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportCSV, exportPDF, exportScreenshot }
}
