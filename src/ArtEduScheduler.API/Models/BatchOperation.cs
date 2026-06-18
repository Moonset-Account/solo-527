namespace ArtEduScheduler.API.Models;

public class BatchOperation
{
    public Guid Id { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public int OperatorId { get; set; }
    public User? Operator { get; set; }
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string? FailedItems { get; set; }
    public string? Summary { get; set; }
    public bool Completed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class ReportMonthly
{
    public int Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int? StudentId { get; set; }
    public Student? Student { get; set; }
    public int TotalClasses { get; set; }
    public int AttendedClasses { get; set; }
    public int AbsentClasses { get; set; }
    public int LeaveClasses { get; set; }
    public int TotalHoursUsed { get; set; }
    public int FeedbackCount { get; set; }
    public decimal AverageScore { get; set; }
    public string? FeedbacksSummary { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
