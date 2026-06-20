
using TicketCounter.Domain.Enums;

namespace TicketCounter.Application.DTOs;

public class TodoItemDto
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
}

public class CreateTodoItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoPriority Priority { get; set; } = TodoPriority.Medium;
    public string? RelatedType { get; set; }
    public Guid? RelatedId { get; set; }
    public string? MissingFields { get; set; }
    public bool AffectsInventory { get; set; }
    public string? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
}

public class ResolveTodoItemDto
{
    public TodoStatus Status { get; set; }
    public string Resolution { get; set; } = string.Empty;
}

public class OperationLogDto
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
    public string? ChangedFields { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
}

public class OperationLogQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public AuditAction? Action { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Operator { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? IsSuccess { get; set; }
}

public class ApiRetryRecordDto
{
    public Guid Id { get; set; }
    public string ApiName { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string RequestUrl { get; set; } = string.Empty;
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
    public ApiRetryStatus RetryStatus { get; set; }
    public int RetryCount { get; set; }
    public int MaxRetryCount { get; set; }
    public DateTime? NextRetryAt { get; set; }
    public DateTime? LastRetriedAt { get; set; }
    public DateTime? SucceededAt { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApiRetryQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public ApiRetryStatus? RetryStatus { get; set; }
    public string? ApiName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class InventoryOccupancyDto
{
    public Guid SessionId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public TicketType TicketType { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public int TotalCapacity { get; set; }
    public int ApprovedOccupancy { get; set; }
    public int PendingReviewOccupancy { get; set; }
    public int MissingDataOccupancy { get; set; }
    public int ReservedOccupancy { get; set; }
    public int OccupiedTotal => ApprovedOccupancy + PendingReviewOccupancy + MissingDataOccupancy + ReservedOccupancy;
    public int AvailableCount { get; set; }
    public decimal OccupancyRate => TotalCapacity > 0 ? Math.Round((decimal)OccupiedTotal / TotalCapacity * 100, 2) : 0;
    public DateTime UpdatedAt { get; set; }
}

public class DashboardStatsDto
{
    public int TotalRegistrations { get; set; }
    public int PendingReviewCount { get; set; }
    public int ApprovedCount { get; set; }
    public int MissingDataCount { get; set; }
    public int TodoCount { get; set; }
    public int SessionsCount { get; set; }
    public int TotalSeats { get; set; }
    public int SoldSeats { get; set; }
    public int FailedApiCount { get; set; }
    public decimal SeatOccupancyRate { get; set; }
    public IEnumerable<InventoryOccupancyDto> InventoryBySession { get; set; } = new List<InventoryOccupancyDto>();
    public IEnumerable<RegistrationDto> RecentRegistrations { get; set; } = new List<RegistrationDto>();
    public IEnumerable<TodoItemDto> RecentTodos { get; set; } = new List<TodoItemDto>();
}
