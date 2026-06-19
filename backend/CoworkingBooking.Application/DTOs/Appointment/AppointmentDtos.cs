using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Application.DTOs.Appointment;

public class AppointmentDto
{
    public Guid Id { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public Guid SpaceId { get; set; }
    public string SpaceName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerCompany { get; set; }
    public DateTime ViewingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public Guid? ConsultantId { get; set; }
    public string? ConsultantName { get; set; }
    public string? Remarks { get; set; }
    public string? SourceChannel { get; set; }
    public int? PersonCount { get; set; }
    public string? Requirements { get; set; }
    public bool HasNoShow { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<FollowUpDto> FollowUps { get; set; } = new();
}

public class FollowUpDto
{
    public Guid Id { get; set; }
    public Guid ConsultantId { get; set; }
    public string ConsultantName { get; set; } = string.Empty;
    public string FollowUpType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime FollowUpTime { get; set; }
    public DateTime? NextFollowUpTime { get; set; }
    public string? NextStep { get; set; }
    public int? CustomerSatisfaction { get; set; }
}

public class CreateAppointmentRequest
{
    public Guid SpaceId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerCompany { get; set; }
    public DateTime ViewingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Remarks { get; set; }
    public string? SourceChannel { get; set; }
    public int? PersonCount { get; set; }
    public string? Requirements { get; set; }
}

public class AssignConsultantRequest
{
    public Guid ConsultantId { get; set; }
}

public class UpdateAppointmentStatusRequest
{
    public AppointmentStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class AddFollowUpRequest
{
    public string FollowUpType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime? NextFollowUpTime { get; set; }
    public string? NextStep { get; set; }
    public int? CustomerSatisfaction { get; set; }
}

public class AppointmentQuery : Common.PagedQuery
{
    public AppointmentStatus? Status { get; set; }
    public Guid? SpaceId { get; set; }
    public Guid? ConsultantId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class NoShowRecordDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public DateTime NoShowDate { get; set; }
    public string? Reason { get; set; }
    public NoShowHandleResult HandleResult { get; set; }
    public string? HandleDetail { get; set; }
    public Guid? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public DateTime? HandledAt { get; set; }
    public bool IsHandled { get; set; }
    public string? PenaltyDetail { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class HandleNoShowRequest
{
    public string Reason { get; set; } = string.Empty;
    public NoShowHandleResult HandleResult { get; set; }
    public string HandleDetail { get; set; } = string.Empty;
    public string? PenaltyDetail { get; set; }
}

public class NoShowQuery : Common.PagedQuery
{
    public bool? IsHandled { get; set; }
    public NoShowHandleResult? HandleResult { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
