namespace ProcessScheduling.Domain.Entities;

public class AdjustmentRecord : BaseEntity
{
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? PreviousValue { get; set; }
    public string NewValue { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public Guid OperatorId { get; set; }
    public User Operator { get; set; } = null!;
}
