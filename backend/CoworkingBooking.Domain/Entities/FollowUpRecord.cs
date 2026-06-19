namespace CoworkingBooking.Domain.Entities;

public class FollowUpRecord : EntityBase
{
    public Guid AppointmentId { get; set; }
    public Guid ConsultantId { get; set; }
    public string ConsultantName { get; set; } = string.Empty;
    public string FollowUpType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime FollowUpTime { get; set; }
    public DateTime? NextFollowUpTime { get; set; }
    public string? NextStep { get; set; }
    public int? CustomerSatisfaction { get; set; }
    public string? Attachment { get; set; }

    public ViewingAppointment Appointment { get; set; } = null!;
    public ApplicationUser Consultant { get; set; } = null!;
}
