namespace ProcessScheduling.Application.DTOs;

public class WorkReportDto
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public Guid EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public Guid ShiftId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public int CompletedQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public double WorkHours { get; set; }
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public Guid? ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime CreatedAt { get; set; }
}
