
namespace PrintingFactory.Domain.Entities;

public class BatchOperation
{
    public int Id { get; set; }
    public string OperationName { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public BatchOperationStatus Status { get; set; } = BatchOperationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Remarks { get; set; }
    public ICollection<BatchOperationItem> Items { get; set; } = new List<BatchOperationItem>();
}

public enum BatchOperationStatus
{
    Pending,
    Confirmed,
    Processing,
    Completed,
    PartiallyCompleted,
    Cancelled
}

public class BatchOperationItem
{
    public int Id { get; set; }
    public int BatchOperationId { get; set; }
    public BatchOperation? BatchOperation { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public BatchItemStatus Status { get; set; } = BatchItemStatus.Pending;
    public string? ErrorMessage { get; set; }
    public bool CanRetry { get; set; } = true;
    public int RetryCount { get; set; } = 0;
    public DateTime? ProcessedAt { get; set; }
}

public enum BatchItemStatus
{
    Pending,
    Processing,
    Success,
    Failed
}
