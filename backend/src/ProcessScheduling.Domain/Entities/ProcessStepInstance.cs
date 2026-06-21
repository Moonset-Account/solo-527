using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class ProcessStepInstance : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid ProcessStepTemplateId { get; set; }
    public ProcessStepStatus Status { get; set; } = ProcessStepStatus.Pending;
    public Guid? EquipmentId { get; set; }
    public Guid? OperatorId { get; set; }
    public Guid? ShiftId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? OutputQuantity { get; set; }
    public int? DefectiveQuantity { get; set; }
    public string? AbnormalReason { get; set; }
    public string QrCode { get; set; } = string.Empty;
    public WorkOrder WorkOrder { get; set; } = null!;
    public ProcessStepTemplate ProcessStepTemplate { get; set; } = null!;
    public Equipment? Equipment { get; set; }
    public User? Operator { get; set; }
    public Shift? Shift { get; set; }
    public ICollection<ProcessStepStatusChange> StatusChanges { get; set; } = new List<ProcessStepStatusChange>();
}
