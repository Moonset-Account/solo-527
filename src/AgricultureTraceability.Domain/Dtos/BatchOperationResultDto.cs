using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Dtos;

public class BatchOperationResultDto
{
    public Guid OperationId { get; set; }
    public OperationStatus Status { get; set; }
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string? Summary { get; set; }
    public List<BatchOperationFailedItem> FailedItems { get; set; } = new();
}

public class BatchOperationFailedItem
{
    public Guid EntityId { get; set; }
    public string? EntityType { get; set; }
    public string? ErrorMessage { get; set; }
}
