using Counseling.Domain.Enums;

namespace Counseling.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public UserRole Role { get; set; }
    public PrivacyLevel PrivacyLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class Counselor : BaseEntity
{
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Specialties { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public int MaxDailyAppointments { get; set; } = 8;
    public ICollection<ServiceItem> ServiceItems { get; set; } = new List<ServiceItem>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class ServiceItem : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public ServiceStatus Status { get; set; } = ServiceStatus.Active;
    public PrivacyLevel PrivacyLevel { get; set; } = PrivacyLevel.Public;
    public ICollection<Counselor> Counselors { get; set; } = new List<Counselor>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class Appointment : BaseEntity
{
    public string AppointmentNo { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public User? Client { get; set; }
    public int CounselorId { get; set; }
    public Counselor? Counselor { get; set; }
    public int ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? Notes { get; set; }
    public decimal Price { get; set; }
    public bool IsFromWaitlist { get; set; }
    public CheckInRecord? CheckInRecord { get; set; }
    public RefundRecord? RefundRecord { get; set; }
    public NoShowRecord? NoShowRecord { get; set; }
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}

public class CheckInRecord : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public DateTime CheckInTime { get; set; }
    public CheckInMethod CheckInMethod { get; set; } = CheckInMethod.Manual;
    public string? CheckedInBy { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? ConfirmedBy { get; set; }
    public string? Remarks { get; set; }
}

public class NoShowRecord : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? RecordedBy { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsWaived { get; set; }
    public string? WaivedReason { get; set; }
    public string? WaivedBy { get; set; }
}

public class RefundRecord : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public decimal Amount { get; set; }
    public RefundStatus Status { get; set; } = RefundStatus.Pending;
    public string Reason { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public string? RejectedReason { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TransactionId { get; set; }
}

public class WaitlistItem : BaseEntity
{
    public int ClientId { get; set; }
    public User? Client { get; set; }
    public int ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public int? PreferredCounselorId { get; set; }
    public Counselor? PreferredCounselor { get; set; }
    public DateTime PreferredDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0;
    public bool Notified { get; set; }
    public DateTime? NotifiedAt { get; set; }
}

public class Reminder : BaseEntity
{
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public ReminderType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }
}

public class StoreClosure : BaseEntity
{
    public DateTime ClosureDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsFullDay { get; set; }
    public string? AffectedCounselors { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class StatisticsDaily
{
    public DateTime Date { get; set; }
    public int TotalAppointments { get; set; }
    public int CheckedInCount { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal Revenue { get; set; }
    public int NewClients { get; set; }
    public int RefundCount { get; set; }
    public decimal RefundAmount { get; set; }
}
