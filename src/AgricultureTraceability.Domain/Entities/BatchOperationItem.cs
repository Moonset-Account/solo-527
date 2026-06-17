namespace AgricultureTraceability.Domain.Entities;

public class BatchOperationItem
{
    public Guid Id { get; set; }
    public Guid BatchOperationId { get; set; }
    public BatchOperation? BatchOperation { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
}
