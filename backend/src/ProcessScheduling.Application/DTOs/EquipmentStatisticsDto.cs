namespace ProcessScheduling.Application.DTOs;

public class EquipmentStatisticsDto
{
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public double RunningHours { get; set; }
    public double DowntimeHours { get; set; }
    public double UtilizationRate { get; set; }
    public int DowntimeCount { get; set; }
}
