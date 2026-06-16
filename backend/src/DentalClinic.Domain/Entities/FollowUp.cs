
namespace DentalClinic.Domain.Entities;

public class FollowUp
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public int ResponsiblePersonId { get; set; }
    public string? ResponsiblePersonName { get; set; }
    public FollowUpType Type { get; set; }
    public FollowUpStatus Status { get; set; } = FollowUpStatus.Pending;
    public DateTime PlannedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }
    public string? Content { get; set; }
    public string? Result { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Patient? Patient { get; set; }
    public Appointment? Appointment { get; set; }
    public Doctor? Doctor { get; set; }
}

public enum FollowUpType
{
    AfterTreatment = 1,
    Postoperative = 2,
    RegularCheck = 3,
    Other = 99
}

public enum FollowUpStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Overdue = 4,
    Cancelled = 5
}
