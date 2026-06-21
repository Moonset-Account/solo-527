namespace ProcessScheduling.Application.DTOs;

public class WorkOrderDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public int PlannedQuantity { get; set; }
    public int CompletedQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public DateTime PlannedStartTime { get; set; }
    public DateTime PlannedEndTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public Guid? AssignedEquipmentId { get; set; }
    public string? EquipmentName { get; set; }
    public Guid? AssignedShiftId { get; set; }
    public string? ShiftName { get; set; }
    public string? Remarks { get; set; }
}
