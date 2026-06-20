
using TicketCounter.Domain.Enums;

namespace TicketCounter.Domain.Entities;

public class OperationLog
{
    public Guid Id { get; set; }
    public AuditAction Action { get; set; }
    public string ActionName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string Operator { get; set; } = string.Empty;
    public string? OperatorRole { get; set; }
    public DateTime OperatedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? OriginalValues { get; set; }
    public string? NewValues { get; set; }
    public string? ChangedFields { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
}

public class TodoItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoPriority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public string? RelatedType { get; set; }
    public Guid? RelatedId { get; set; }
    public string? MissingFields { get; set; }
    public bool AffectsInventory { get; set; }
    public string? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Resolver { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class ApiRetryRecord
{
    public Guid Id { get; set; }
    public string ApiName { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string RequestUrl { get; set; } = string.Empty;
    public string? RequestBody { get; set; }
    public string? RequestHeaders { get; set; }
    public string? ResponseBody { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? StackTrace { get; set; }
    public ApiRetryStatus RetryStatus { get; set; }
    public int RetryCount { get; set; }
    public int MaxRetryCount { get; set; }
    public DateTime? NextRetryAt { get; set; }
    public DateTime? LastRetriedAt { get; set; }
    public DateTime? SucceededAt { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class InventoryOccupancy
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public TicketType TicketType { get; set; }
    public int TotalCapacity { get; set; }
    public int ApprovedOccupancy { get; set; }
    public int PendingReviewOccupancy { get; set; }
    public int MissingDataOccupancy { get; set; }
    public int ReservedOccupancy { get; set; }
    public int AvailableCount { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Session? Session { get; set; }
}
