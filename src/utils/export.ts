import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Candidate } from '../data/types';
import { formatDate } from './format';

export function exportToCSV(data: Candidate[], filename: string) {
  const csvData = data.map(c => ({
    '候选人姓名': c.name,
    '职位': c.positionName,
    '部门': c.departmentName,
    '招聘渠道': c.channelName,
    '招聘官': c.recruiterName,
    '申请日期': formatDate(c.applyDate),
    '当前阶段': c.currentStageName,
    '状态': getStatusLabel(c.status),
    '总周期(天)': c.totalCycleDays || '',
    '是否有异常': c.stages.some(s => s.isAnomaly) ? '是' : '否',
    '满意度': c.feedback?.satisfaction || '',
    '反馈内容': c.feedback?.comments || '',
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${formatDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_progress: '进行中',
    hired: '已入职',
    rejected: '已拒绝',
    offer_declined: 'Offer拒绝',
  };
  return labels[status] || status;
}

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${filename}_${formatDate(new Date())}.pdf`);
  } catch (error) {
    console.error('PDF导出失败:', error);
    throw error;
  }
}

export async function exportScreenshot(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = `${filename}_${formatDate(new Date())}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('截图导出失败:', error);
    throw error;
  }
}

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
