using ArtEduScheduler.API.Models;

namespace ArtEduScheduler.API.DTOs;

public class AttendanceDto
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
    public bool HoursDeducted { get; set; }
    public string? Notes { get; set; }
}

public class MarkAttendanceDto
{
    public int ScheduleId { get; set; }
    public int StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public bool DeductHours { get; set; } = true;
    public string? Notes { get; set; }
}

public class BatchAttendanceDto
{
    public int ScheduleId { get; set; }
    public List<MarkAttendanceDto> Attendances { get; set; } = new();
}

public class LeaveRecordDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int ScheduleId { get; set; }
    public DateTime ScheduleStartTime { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; }
    public bool HoursDeducted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeaveDto
{
    public int StudentId { get; set; }
    public int ScheduleId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ProcessLeaveDto
{
    public int LeaveId { get; set; }
    public bool Approve { get; set; }
    public bool DeductHours { get; set; } = false;
    public string? RejectReason { get; set; }
}

public class WorkFeedbackDto
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DateTime ScheduleDate { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string WorkTitle { get; set; } = string.Empty;
    public string? WorkImageUrl { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Suggestions { get; set; }
    public bool ParentNotified { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkFeedbackDto
{
    public int ScheduleId { get; set; }
    public int StudentId { get; set; }
    public string WorkTitle { get; set; } = string.Empty;
    public string? WorkImageUrl { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Suggestions { get; set; }
    public bool NotifyParent { get; set; } = true;
}

public class HomeSchoolFeedbackDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public FeedbackType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsReminder { get; set; }
    public DateTime? ReminderDate { get; set; }
    public bool ParentRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateHomeSchoolFeedbackDto
{
    public int StudentId { get; set; }
    public FeedbackType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsReminder { get; set; } = false;
    public DateTime? ReminderDate { get; set; }
    public bool IncludeInMonthlyReport { get; set; } = true;
}
