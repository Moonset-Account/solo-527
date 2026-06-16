
using GridEventManagement.Web.DTOs;

namespace GridEventManagement.Web.Services;

public interface IReportService
{
    Task<DashboardReportDto> GetDashboardReportAsync(ReportQueryDto query);
    Task<List<EventStatusReportDto>> GetEventStatusReportAsync(ReportQueryDto query);
    Task<List<EventTypeReportDto>> GetEventTypeReportAsync(ReportQueryDto query);
    Task<List<GridReportDto>> GetGridReportAsync(ReportQueryDto query);
    Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync(ReportQueryDto query);
    Task<ClosureReportDto> GetClosureReportAsync(ReportQueryDto query);
}
