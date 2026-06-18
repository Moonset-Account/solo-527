namespace ArtEduScheduler.API.Models;

public enum OperationType
{
    ParentNotification = 1,
    ScheduleChange = 2,
    WorkFeedback = 3,
    HoursDeduction = 4,
    LeaveApproval = 5,
    ClassAdjustment = 6,
    FeedbackReply = 7,
    BatchOperation = 8
}

public class OperationLog
{
    public int Id { get; set; }
    public OperationType OperationType { get; set; }
    public int OperatorId { get; set; }
    public User? Operator { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public string ChangeDescription { get; set; } = string.Empty;
    public string? RelatedIds { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType
{
    ScheduleChange = 1,
    HoursInsufficient = 2,
    WorkFeedback = 3,
    LeaveApproved = 4,
    LeaveRejected = 5,
    HomeFeedback = 6,
    SystemNotice = 7
}

public class Notification
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public int? FromUserId { get; set; }
    public User? FromUser { get; set; }
    public int ToUserId { get; set; }
    public User? ToUser { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class HoursWarning
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int RemainingHours { get; set; }
    public int ThresholdHours { get; set; }
    public bool NotifiedAdvisor { get; set; } = false;
    public int? AdvisorId { get; set; }
    public User? Advisor { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public bool Resolved { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
