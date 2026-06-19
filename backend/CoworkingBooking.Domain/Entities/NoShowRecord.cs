using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class NoShowRecord : EntityBase
{
    public Guid AppointmentId { get; set; }
    public string AppointmentNo { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public DateTime NoShowDate { get; set; }
    public string? Reason { get; set; }
    public NoShowHandleResult HandleResult { get; set; } = NoShowHandleResult.Pending;
    public string? HandleDetail { get; set; }
    public Guid? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public DateTime? HandledAt { get; set; }
    public bool IsHandled { get; set; } = false;
    public string? PenaltyDetail { get; set; }

    public ViewingAppointment Appointment { get; set; } = null!;
}
