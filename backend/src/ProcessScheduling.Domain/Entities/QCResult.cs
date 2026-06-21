namespace ProcessScheduling.Domain.Entities;

public class QCResult : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public Guid ProcessStepInstanceId { get; set; }
    public Guid InspectorId { get; set; }
    public string Result { get; set; } = string.Empty;
    public int SampleSize { get; set; }
    public int PassCount { get; set; }
    public int FailCount { get; set; }
    public string? DefectDescription { get; set; }
    public string? Remarks { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public ProcessStepInstance ProcessStepInstance { get; set; } = null!;
    public User Inspector { get; set; } = null!;
    public ICollection<QCResultHistory> Histories { get; set; } = new List<QCResultHistory>();
}
