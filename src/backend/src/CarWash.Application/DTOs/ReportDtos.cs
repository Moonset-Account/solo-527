namespace CarWash.Application.DTOs;

public class ConversionReportDto
{
    public string Period { get; set; } = string.Empty;
    public int TotalAppointments { get; set; }
    public int ArrivedCount { get; set; }
    public decimal ArrivalRate { get; set; }
    public int CompletedCount { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal AvgRevenue { get; set; }
}

public class TechnicianPerformanceDto
{
    public Guid TechnicianId { get; set; }
    public string TechnicianName { get; set; } = string.Empty;
    public int ServiceCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal Rating { get; set; }
}

public class DashboardSummaryDto
{
    public int TodayAppointments { get; set; }
    public int ArrivedCount { get; set; }
    public int InServiceCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal TodayRevenue { get; set; }
    public int AvailableTechnicians { get; set; }
    public int AvailableWorkstations { get; set; }
    public int ActivePartsShortages { get; set; }
}

public class ReportQueryRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? PeriodType { get; set; }
}
