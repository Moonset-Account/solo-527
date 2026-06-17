namespace AgricultureTraceability.Domain.Dtos;

public class DashboardStatsDto
{
    public int ActivePlots { get; set; }
    public int ActiveBatches { get; set; }
    public int ActiveAlerts { get; set; }
    public decimal TodayHarvestWeight { get; set; }
    public int MaterialMissingCount { get; set; }
    public int PendingOrdersCount { get; set; }
}
