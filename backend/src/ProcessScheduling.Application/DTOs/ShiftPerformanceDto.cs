namespace ProcessScheduling.Application.DTOs;

public class ShiftPerformanceDto
{
    public Guid Id { get; set; }
    public Guid ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int TotalOutput { get; set; }
    public int TotalDefective { get; set; }
    public double TotalWorkHours { get; set; }
    public double EquipmentUtilizationRate { get; set; }
    public double PassRate { get; set; }
}
