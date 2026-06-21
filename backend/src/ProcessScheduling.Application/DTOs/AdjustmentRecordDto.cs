namespace ProcessScheduling.Application.DTOs;

public class AdjustmentRecordDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? PreviousValue { get; set; }
    public string NewValue { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
