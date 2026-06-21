namespace ProcessScheduling.Application.DTOs;

public class ProcessStepInstanceDto
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public Guid ProcessStepTemplateId { get; set; }
    public string StepName { get; set; } = string.Empty;
    public string StepCode { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public Guid? EquipmentId { get; set; }
    public string? EquipmentCode { get; set; }
    public string? EquipmentName { get; set; }
    public Guid? OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? OutputQuantity { get; set; }
    public int? DefectiveQuantity { get; set; }
    public string? AbnormalReason { get; set; }
    public string QrCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
