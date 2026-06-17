using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class BatchOperation
{
    public Guid Id { get; set; }
    public string? OperationType { get; set; }
    public OperationStatus Status { get; set; }
    public string? Summary { get; set; }
    public DateTime OperatedAt { get; set; }
    public Guid? OperatedBy { get; set; }
    public ICollection<BatchOperationItem> Items { get; set; } = new List<BatchOperationItem>();
}
