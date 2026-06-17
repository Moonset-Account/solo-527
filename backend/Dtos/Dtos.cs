using OpsWorkOrder.Enums;

namespace OpsWorkOrder.Dtos;

public record LoginRequestDto
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public record LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}

public record UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record CreateUserDto
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}

public record UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
}

public record AlertDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AlertType Type { get; set; }
    public AlertPriority Priority { get; set; }
    public AlertStatus Status { get; set; }

    public int? AssetId { get; set; }
    public string? AssetName { get; set; }
    public int? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? DueDate { get; set; }

    public bool IsOverdue { get; set; }
    public string? RollbackPlan { get; set; }
}

public record CreateAlertDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AlertType Type { get; set; }
    public AlertPriority Priority { get; set; }
    public int? AssetId { get; set; }
    public DateTime? DueDate { get; set; }
}

public record UpdateAlertDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public AlertPriority? Priority { get; set; }
    public DateTime? DueDate { get; set; }
}

public record AssignAlertDto
{
    public int AssignedToId { get; set; }
    public AlertPriority Priority { get; set; }
    public string? Remark { get; set; }
}

public record ProcessAlertDto
{
    public AlertStatus ToStatus { get; set; }
    public string Remark { get; set; } = string.Empty;
    public string? RollbackPlan { get; set; }
}

public record AlertProcessLogDto
{
    public int Id { get; set; }
    public int AlertId { get; set; }
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public AlertStatus FromStatus { get; set; }
    public AlertStatus ToStatus { get; set; }
    public string ActionDescription { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record AssetDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AssetType Type { get; set; }
    public AssetStatus Status { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Configuration { get; set; }
    public int? ResponsibleId { get; set; }
    public string? ResponsibleName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public bool SyncRequired { get; set; }
}

public record CreateAssetDto
{
    public string AssetCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AssetType Type { get; set; }
    public AssetStatus Status { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Configuration { get; set; }
    public int? ResponsibleId { get; set; }
}

public record UpdateAssetDto
{
    public string? Name { get; set; }
    public AssetType? Type { get; set; }
    public AssetStatus? Status { get; set; }
    public string? IpAddress { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Configuration { get; set; }
    public int? ResponsibleId { get; set; }
}

public record AssetSyncConfirmDto
{
    public string Configuration { get; set; } = string.Empty;
    public string? Remark { get; set; }
}

public record BatchTaskDto
{
    public int Id { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public BatchTaskType TaskType { get; set; }
    public BatchTaskStatus Status { get; set; }
    public int CreatorId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int CurrentIndex { get; set; }
    public double ProgressPercent { get; set; }
    public string? ResultSummary { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public record BatchTaskDetailDto : BatchTaskDto
{
    public List<BatchTaskItemDto> Items { get; set; } = new();
}

public record BatchTaskItemDto
{
    public int Id { get; set; }
    public int ItemIndex { get; set; }
    public string ItemKey { get; set; } = string.Empty;
    public string? ItemData { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ResultData { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public record CreateBatchTaskDto
{
    public string TaskName { get; set; } = string.Empty;
    public BatchTaskType TaskType { get; set; }
    public List<int> ItemIds { get; set; } = new();
    public string? Parameters { get; set; }
}

public record NotificationDto
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record AuditLogDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public UserRole UserRole { get; set; }
    public AuditActionType ActionType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Remark { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public record VulnerabilityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CveId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AlertPriority Severity { get; set; }
    public int? AssetId { get; set; }
    public string? AssetName { get; set; }
    public DateTime DiscoveredAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public bool IsOverdue { get; set; }
    public int ExtendCount { get; set; }
    public string? RemediationPlan { get; set; }
}

public record ExtendVulnerabilityDto
{
    public DateTime NewDueDate { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public record PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public record AlertQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public AlertStatus? Status { get; set; }
    public AlertPriority? Priority { get; set; }
    public AlertType? Type { get; set; }
    public int? AssignedToId { get; set; }
    public int? AssetId { get; set; }
    public string? Keyword { get; set; }
    public bool? IsOverdue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
