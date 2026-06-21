using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class ProcessStepStatusChange : BaseEntity
{
    public Guid ProcessStepInstanceId { get; set; }
    public ProcessStepStatus PreviousStatus { get; set; }
    public ProcessStepStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public ProcessStepInstance ProcessStepInstance { get; set; } = null!;
}
