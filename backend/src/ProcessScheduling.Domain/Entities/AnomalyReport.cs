namespace ProcessScheduling.Domain.Entities;

public class AnomalyReport : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public Guid ReporterId { get; set; }
    public string AnomalyType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Status { get; set; } = "Reported";
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
    public Guid? ShiftId { get; set; }
    public Equipment Equipment { get; set; } = null!;
    public User Reporter { get; set; } = null!;
    public Shift? Shift { get; set; }
}
