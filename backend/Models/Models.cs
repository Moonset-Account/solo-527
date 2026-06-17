using OpsWorkOrder.Enums;

namespace OpsWorkOrder.Models;

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<Alert> AssignedAlerts { get; set; } = new List<Alert>();
    public ICollection<Alert> CreatedAlerts { get; set; } = new List<Alert>();
    public ICollection<AlertProcessLog> ProcessLogs { get; set; } = new List<AlertProcessLog>();
}

public class Alert
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AlertType Type { get; set; }
    public AlertPriority Priority { get; set; }
    public AlertStatus Status { get; set; }

    public int? AssetId { get; set; }
    public Asset? Asset { get; set; }

    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? DueDate { get; set; }

    public bool IsOverdue { get; set; }

    public string? RollbackPlan { get; set; }

    public ICollection<AlertProcessLog> ProcessLogs { get; set; } = new List<AlertProcessLog>();
    public ICollection<AlertAttachment> Attachments { get; set; } = new List<AlertAttachment>();
}

public class AlertProcessLog
{
    public int Id { get; set; }
    public int AlertId { get; set; }
    public Alert Alert { get; set; } = null!;

    public int OperatorId { get; set; }
    public User Operator { get; set; } = null!;

    public AlertStatus FromStatus { get; set; }
    public AlertStatus ToStatus { get; set; }

    public string ActionDescription { get; set; } = string.Empty;
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AlertAttachment
{
    public int Id { get; set; }
    public int AlertId { get; set; }
    public Alert Alert { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class Asset
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
    public User? Responsible { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSyncAt { get; set; }
    public bool SyncRequired { get; set; }

    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}

public class BatchTask
{
    public int Id { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public BatchTaskType TaskType { get; set; }
    public BatchTaskStatus Status { get; set; }

    public int CreatorId { get; set; }
    public User Creator { get; set; } = null!;

    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int CurrentIndex { get; set; }

    public string? Parameters { get; set; }
    public string? ResultSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<BatchTaskItem> Items { get; set; } = new List<BatchTaskItem>();
}

public class BatchTaskItem
{
    public int Id { get; set; }
    public int BatchTaskId { get; set; }
    public BatchTask BatchTask { get; set; } = null!;

    public int ItemIndex { get; set; }
    public string ItemKey { get; set; } = string.Empty;
    public string? ItemData { get; set; }

    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ResultData { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? RelatedId { get; set; }
    public string? RelatedType { get; set; }

    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public UserRole UserRole { get; set; }

    public AuditActionType ActionType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }

    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    public string? Remark { get; set; }

    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Vulnerability
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CveId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AlertPriority Severity { get; set; }

    public int? AssetId { get; set; }
    public Asset? Asset { get; set; }

    public DateTime DiscoveredAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public bool IsOverdue { get; set; }
    public int ExtendCount { get; set; }

    public string? RemediationPlan { get; set; }
}
