namespace ProcessScheduling.Domain.Entities;

public class ShiftPerformance : BaseEntity
{
    public Guid ShiftId { get; set; }
    public DateTime Date { get; set; }
    public int TotalOutput { get; set; }
    public int TotalDefective { get; set; }
    public double TotalWorkHours { get; set; }
    public double EquipmentUtilizationRate { get; set; }
    public double PassRate { get; set; }
    public Shift Shift { get; set; } = null!;
}
