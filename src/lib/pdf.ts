import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  includeCharts?: boolean;
  includeDataTable?: boolean;
  filters?: Record<string, any>;
  metrics?: Record<string, any>;
}

export async function exportToPDF(
  elementId: string,
  options: PDFExportOptions
): Promise<void> {
  let element = document.getElementById(elementId);
  
  if (!element) {
    element = document.querySelector(".space-y-4") as HTMLElement;
  }
  
  if (!element) {
    generateSimplePDF(options.title, `数据报告生成时间: ${new Date().toLocaleString()}\n\n由于页面元素加载问题，仅生成了基础报告。`, {
      filename: `${options.title}.pdf`,
    });
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 20;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(options.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  if (options.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(100);
    pdf.text(options.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  pdf.setFontSize(9);
  pdf.setTextColor(150);
  pdf.text(
    `生成时间: ${format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );
  currentY += 10;

  if (options.metrics) {
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.1);
    pdf.line(15, currentY, pageWidth - 15, currentY);
    currentY += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    pdf.text("关键指标", 15, currentY);
    currentY += 8;

    const metrics = Object.entries(options.metrics);
    const cols = 3;
    const colWidth = (pageWidth - 30) / cols;

    for (let i = 0; i < metrics.length; i += cols) {
      for (let j = 0; j < cols && i + j < metrics.length; j++) {
        const [key, value] = metrics[i + j];
        const x = 15 + j * colWidth;
        
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(key, x, currentY);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0);
        pdf.text(String(value), x, currentY + 5);
      }
      currentY += 12;
    }
    currentY += 5;
  }

  if (options.filters && Object.keys(options.filters).length > 0) {
    pdf.setDrawColor(200);
    pdf.line(15, currentY, pageWidth - 15, currentY);
    currentY += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    pdf.text("筛选条件", 15, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    pdf.setTextColor(60);
    
    const filterTexts = buildFilterText(options.filters);
    filterTexts.forEach((text) => {
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.text(`• ${text}`, 20, currentY);
      currentY += 6;
    });
    currentY += 5;
  }

  if (options.includeCharts) {
    pdf.setDrawColor(200);
    pdf.line(15, currentY, pageWidth - 15, currentY);
    currentY += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    pdf.text("数据图表", 15, currentY);
    currentY += 8;

    const charts = element.querySelectorAll("[data-chart]");
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i] as HTMLElement;
      const chartTitle = chart.getAttribute("data-chart-title") || `图表 ${i + 1}`;

      try {
        const canvas = await html2canvas(chart, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - 30) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(10);
        pdf.setTextColor(80);
        pdf.text(chartTitle, 15, currentY);
        currentY += 5;

        pdf.addImage(imgData, "PNG", 15, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (err) {
        console.error("Failed to capture chart:", err);
      }
    }
  }

  if (options.includeDataTable) {
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setDrawColor(200);
    pdf.line(15, currentY, pageWidth - 15, currentY);
    currentY += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(0);
    pdf.text("数据明细", 15, currentY);
    currentY += 8;
  }

  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text(
    "本报告由医院门诊等待时间分析系统自动生成，所有患者信息均已脱敏处理",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  const fileName = `${options.title}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  pdf.save(fileName);
}

function buildFilterText(filters: Record<string, any>): string[] {
  const texts: string[] = [];

  if (filters.dateRange) {
    texts.push(`日期范围: ${filters.dateRange[0]} ~ ${filters.dateRange[1]}`);
  }
  if (filters.departments?.length > 0) {
    texts.push(`科室: 已选择 ${filters.departments.length} 个科室`);
  }
  if (filters.doctors?.length > 0) {
    texts.push(`医生: 已选择 ${filters.doctors.length} 位医生`);
  }
  if (filters.patientTypes?.length > 0) {
    texts.push(`患者类型: 已选择 ${filters.patientTypes.length} 种类型`);
  }
  if (filters.timeSlots?.length > 0) {
    texts.push(`时段: 已选择 ${filters.timeSlots.length} 个时段`);
  }
  if (filters.processNodes?.length > 0) {
    texts.push(`流程节点: 已选择 ${filters.processNodes.length} 个节点`);
  }

  return texts.length > 0 ? texts : ["筛选条件: 无（全量数据）"];
}

export function generateSimplePDF(
  title: string,
  content: string,
  options: { filename?: string } = {}
): void {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, pageWidth / 2, 30, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  
  const lines = pdf.splitTextToSize(content, pageWidth - 30);
  pdf.text(lines, 15, 50);

  const fileName = options.filename || `${title}_${format(new Date(), "yyyyMMdd")}.pdf`;
  pdf.save(fileName);
}
