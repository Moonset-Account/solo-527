using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IReportService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);
    Task<List<ConversionReportDto>> GetConversionReportsAsync(ReportQueryRequest request,
        CancellationToken cancellationToken = default);
    Task<List<TechnicianPerformanceDto>> GetTechnicianPerformancesAsync(ReportQueryRequest request,
        CancellationToken cancellationToken = default);
}
