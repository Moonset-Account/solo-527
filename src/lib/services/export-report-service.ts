import { BaseService } from './base-service'
import type { ExportReport } from '@/types/database'
import { mockExportReports } from '@/lib/mock-data'

class ExportReportService extends BaseService<ExportReport> {
  constructor() {
    super({ tableName: 'export_reports', useMock: true })
    this.setMockData(mockExportReports)
  }

  async getByType(type: string): Promise<ExportReport[]> {
    const all = await this.getAll()
    return all.filter((r) => r.type === type)
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ExportReport[]> {
    const all = await this.getAll()
    return all.filter((r) => {
      const generatedAt = r.generated_at
      return generatedAt >= startDate && generatedAt <= endDate
    })
  }

  async createReport(
    name: string,
    type: string,
    filters: Record<string, unknown>,
    filterSummary: string,
    generatedBy?: string
  ): Promise<ExportReport> {
    const report: ExportReport = {
      id: `exp-${Date.now()}`,
      name,
      type,
      filters,
      filter_summary: filterSummary,
      generated_at: new Date().toISOString(),
      generated_by: generatedBy,
    }
    return this.create(report)
  }
}

export const exportReportService = new ExportReportService()
