
namespace DentalClinic.Application.DTOs;

public class FollowUpDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string? PatientName { get; set; }
    public string? PatientPhone { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public int ResponsiblePersonId { get; set; }
    public string? ResponsiblePersonName { get; set; }
    public int Type { get; set; }
    public string? TypeText { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public DateTime PlannedDate { get; set; }
    public string? PlannedDateText { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsOverdue { get; set; }
    public string? Content { get; set; }
    public string? Result { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FollowUpCreateDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public int ResponsiblePersonId { get; set; }
    public string? ResponsiblePersonName { get; set; }
    public int Type { get; set; }
    public DateTime PlannedDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Content { get; set; }
}

public class FollowUpUpdateDto
{
    public int Status { get; set; }
    public string? Result { get; set; }
    public string? Remark { get; set; }
    public DateTime? CompletedDate { get; set; }
}

public class FollowUpQueryDto : PagedQueryDto
{
    public int? ClinicId { get; set; }
    public int? DoctorId { get; set; }
    public int? PatientId { get; set; }
    public int? ResponsiblePersonId { get; set; }
    public int? Status { get; set; }
    public int? Type { get; set; }
    public bool? IsOverdue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
