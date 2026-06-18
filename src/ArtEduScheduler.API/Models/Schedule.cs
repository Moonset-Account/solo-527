namespace ArtEduScheduler.API.Models;

public enum ScheduleStatus
{
    Scheduled = 1,
    Completed = 2,
    Cancelled = 3,
    Rescheduled = 4
}

public class Schedule
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public Class? Class { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Classroom { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    public int DurationHours { get; set; }
    public string? Notes { get; set; }
    public int? OriginalScheduleId { get; set; }
    public Schedule? OriginalSchedule { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<WorkFeedback> WorkFeedbacks { get; set; } = new List<WorkFeedback>();
}

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Leave = 4,
    NotMarked = 5
}

public class Attendance
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.NotMarked;
    public bool HoursDeducted { get; set; } = false;
    public string? Notes { get; set; }
    public DateTime? MarkedAt { get; set; }
    public int? MarkedById { get; set; }
}
