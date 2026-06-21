namespace ProcessScheduling.Domain.Entities;

public class ProcessStepTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public string? Description { get; set; }
    public int EstimatedMinutes { get; set; }
    public bool RequireQc { get; set; }
    public ICollection<ProcessStepInstance> ProcessStepInstances { get; set; } = new List<ProcessStepInstance>();
}
