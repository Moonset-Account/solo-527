namespace ProcessScheduling.Application.DTOs;

public class MoldRecordDto
{
    public Guid Id { get; set; }
    public Guid MoldId { get; set; }
    public string MoldCode { get; set; } = string.Empty;
    public string RecordType { get; set; } = string.Empty;
    public string? PreviousValue { get; set; }
    public string NewValue { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? EquipmentId { get; set; }
    public string? EquipmentName { get; set; }
    public DateTime CreatedAt { get; set; }
}
