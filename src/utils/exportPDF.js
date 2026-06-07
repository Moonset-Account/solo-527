import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportToPDF(elementId, filename = 'report.pdf', options = {}) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('找不到要导出的元素:', elementId)
    return
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0E1117',
      logging: false,
      ...options
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let heightLeft = imgHeight
    let position = 10
    
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save(filename)
  } catch (err) {
    console.error('PDF 导出失败:', err)
    throw err
  }
}

export async function exportDashboardReport(title, summaryData, elementId) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('找不到仪表盘元素')
    return
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0E1117',
      logging: false
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.setTextColor(22, 93, 255)
    pdf.text(title, 14, 20)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(139, 148, 158)
    pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, 28)
    
    if (summaryData) {
      pdf.setFontSize(11)
      pdf.setTextColor(240, 246, 252)
      const summaryY = 38
      const items = Object.entries(summaryData)
      items.forEach(([key, val], i) => {
        const x = 14 + (i % 4) * 65
        const y = summaryY + Math.floor(i / 4) * 10
        pdf.text(`${key}: ${val}`, x, y)
      })
    }
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const topOffset = 55
    const availableHeight = pageHeight - topOffset - 10
    const imgWidth = pageWidth - 20
    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, availableHeight)
    
    pdf.addImage(imgData, 'PNG', 10, topOffset, imgWidth, imgHeight)
    
    pdf.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (err) {
    console.error('报告导出失败:', err)
    throw err
  }
}
