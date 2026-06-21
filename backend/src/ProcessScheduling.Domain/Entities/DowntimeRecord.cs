using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class DowntimeRecord : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public DowntimeReason Reason { get; set; }
    public string? ReasonDetail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public double? DurationMinutes { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? ShiftId { get; set; }
    public bool IsLogged { get; set; }
    public Equipment Equipment { get; set; } = null!;
    public User Reporter { get; set; } = null!;
    public Shift? Shift { get; set; }
}
