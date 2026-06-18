namespace ArtEduScheduler.API.Models;

public enum LeaveStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4
}

public class LeaveRecord
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public bool HoursDeducted { get; set; } = false;
    public DateTime? ApprovedAt { get; set; }
    public int? ApprovedById { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class WorkFeedback
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int TeacherId { get; set; }
    public User? Teacher { get; set; }
    public string WorkTitle { get; set; } = string.Empty;
    public string? WorkImageUrl { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Suggestions { get; set; }
    public bool ParentNotified { get; set; } = false;
    public DateTime? ParentNotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class HomeSchoolFeedback
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public FeedbackType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsReminder { get; set; } = false;
    public DateTime? ReminderDate { get; set; }
    public bool ParentRead { get; set; } = false;
    public DateTime? ParentReadAt { get; set; }
    public bool IncludedInReport { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum FeedbackType
{
    StudyProgress = 1,
    Behavior = 2,
    Attendance = 3,
    WorkQuality = 4,
    ExamResult = 5,
    Communication = 6,
    Other = 7
}
