const ExcelJS = require('exceljs');

class ExportService {
  async exportToExcel(data, sheets, filename) {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();

    sheets.forEach(sheetConfig => {
      const sheet = workbook.addWorksheet(sheetConfig.name);
      const sheetData = data[sheetConfig.dataKey] || [];

      if (sheetData.length > 0) {
        const columns = Object.keys(sheetData[0]).map(key => ({
          header: key,
          key,
          width: 15
        }));
        sheet.columns = columns;
        sheet.addRows(sheetData);

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    });

    return workbook.xlsx.writeBuffer();
  }

  generateTrainingExportPayload(athleteId, dateRange, filters) {
    return {
      summary: {
        exportedAt: new Date().toISOString(),
        athleteId,
        dateRange,
        filters
      },
      trainingPlans: [],
      actualTrainings: [],
      recoveryScores: [],
      injuryRecords: []
    };
  }
}

module.exports = new ExportService();
