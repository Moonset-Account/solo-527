namespace ArtEduScheduler.API.DTOs;

public class OperationLogDto
{
    public int Id { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public string ChangeDescription { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? FromUserId { get; set; }
    public string? FromUserName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BatchOperationDto
{
    public Guid Id { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<BatchFailedItem>? FailedItemsList { get; set; }
    public string? Summary { get; set; }
    public bool Completed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class BatchFailedItem
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public object? ItemData { get; set; }
}

public class BatchOperationResult<T>
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<T> SuccessItems { get; set; } = new();
    public List<BatchFailedItem> FailedItems { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}

public class MonthlyReportDto
{
    public int Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int? StudentId { get; set; }
    public string? StudentName { get; set; }
    public int TotalClasses { get; set; }
    public int AttendedClasses { get; set; }
    public int AbsentClasses { get; set; }
    public int LeaveClasses { get; set; }
    public int TotalHoursUsed { get; set; }
    public int FeedbackCount { get; set; }
    public decimal AverageScore { get; set; }
    public List<HomeSchoolFeedbackDto>? Feedbacks { get; set; }
    public string? Notes { get; set; }
}

public class HoursWarningDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int RemainingHours { get; set; }
    public int ThresholdHours { get; set; }
    public bool NotifiedAdvisor { get; set; }
    public string? AdvisorName { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public bool Resolved { get; set; }
}
