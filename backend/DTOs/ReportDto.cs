
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class DashboardReportDto
{
    public int TotalEvents { get; set; }
    public int ClosedEvents { get; set; }
    public int ProcessingEvents { get; set; }
    public int PendingEvents { get; set; }
    public double CloseRate { get; set; }
    public int TotalPatrolTasks { get; set; }
    public int CompletedPatrolTasks { get; set; }
    public int PendingPatrolTasks { get; set; }
    public int TotalResidents { get; set; }
    public int TotalUsers { get; set; }
    public int PendingTodos { get; set; }
}

public class EventStatusReportDto
{
    public EventStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class EventTypeReportDto
{
    public EventType EventType { get; set; }
    public string EventTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class GridReportDto
{
    public int GridId { get; set; }
    public string GridName { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
    public int ClosedEvents { get; set; }
    public int ProcessingEvents { get; set; }
    public double CloseRate { get; set; }
    public int ResidentCount { get; set; }
}

public class MonthlyTrendDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int NewEvents { get; set; }
    public int ClosedEvents { get; set; }
}

public class ClosureReportDto
{
    public int TotalEvents { get; set; }
    public int NormalClosed { get; set; }
    public int AbnormalClosed { get; set; }
    public int OpenEvents { get; set; }
    public double NormalCloseRate { get; set; }
    public double OverallCloseRate { get; set; }
    public double AvgProcessingHours { get; set; }
    public int PendingVisitCount { get; set; }
    public double PendingVisitRate { get; set; }
}

public class ReportQueryDto
{
    public int? GridId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
