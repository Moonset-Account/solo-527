using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class WorkReport : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid OperatorId { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid ShiftId { get; set; }
    public int CompletedQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public double WorkHours { get; set; }
    public WorkReportStatus Status { get; set; } = WorkReportStatus.Pending;
    public string? Remarks { get; set; }
    public Guid? ReviewerId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public User Operator { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
    public User? Reviewer { get; set; }
    public ICollection<WorkReportAudit> Audits { get; set; } = new List<WorkReportAudit>();
}
