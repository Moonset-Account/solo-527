namespace ProcessScheduling.Domain.Entities;

public class MoldRecord : BaseEntity
{
    public Guid MoldId { get; set; }
    public string RecordType { get; set; } = string.Empty;
    public string? PreviousValue { get; set; }
    public string NewValue { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? EquipmentId { get; set; }
    public Mold Mold { get; set; } = null!;
    public Equipment? Equipment { get; set; }
}
