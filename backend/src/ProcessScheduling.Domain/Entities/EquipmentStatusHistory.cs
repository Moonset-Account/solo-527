using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class EquipmentStatusHistory : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public EquipmentStatus PreviousStatus { get; set; }
    public EquipmentStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public Equipment Equipment { get; set; } = null!;
}
