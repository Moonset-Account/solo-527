namespace ProcessScheduling.Application.DTOs;

public class ProductionStatisticsDto
{
    public DateTime Date { get; set; }
    public int TotalOutput { get; set; }
    public int TotalDefective { get; set; }
    public double PassRate { get; set; }
    public double TotalWorkHours { get; set; }
    public int WorkOrderCount { get; set; }
}
