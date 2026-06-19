using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class ViewingAppointment : EntityBase
{
    public string AppointmentNo { get; set; } = string.Empty;
    public Guid SpaceId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerCompany { get; set; }
    public DateTime ViewingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public Guid? ConsultantId { get; set; }
    public string? ConsultantName { get; set; }
    public string? Remarks { get; set; }
    public string? SourceChannel { get; set; }
    public int? PersonCount { get; set; }
    public string? Requirements { get; set; }

    public CoworkingSpace Space { get; set; } = null!;
    public ApplicationUser? Consultant { get; set; }
    public ICollection<FollowUpRecord> FollowUpRecords { get; set; } = new List<FollowUpRecord>();
    public NoShowRecord? NoShowRecord { get; set; }
}
