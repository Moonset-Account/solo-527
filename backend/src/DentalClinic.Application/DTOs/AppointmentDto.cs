
namespace DentalClinic.Application.DTOs;

public class AppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string? PatientName { get; set; }
    public string? PatientPhone { get; set; }
    public int DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string? DoctorTitle { get; set; }
    public int ClinicId { get; set; }
    public string? ClinicName { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string? AppointmentDateText { get; set; }
    public TimeSpan StartTime { get; set; }
    public string? StartTimeText { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? EndTimeText { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public int Type { get; set; }
    public string? TypeText { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Remark { get; set; }
    public int? ScheduleSlotId { get; set; }
    public DateTime CreatedAt { get; set; }

    public List&lt;FeeItemDto&gt;? FeeItems { get; set; }
    public List&lt;ChiefComplaintDto&gt;? ChiefComplaintRecords { get; set; }
    public List&lt;PrescriptionDto&gt;? Prescriptions { get; set; }
}

public class AppointmentCreateDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int ClinicId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int Type { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Remark { get; set; }
    public int? ScheduleSlotId { get; set; }
}

public class AppointmentUpdateDto
{
    public int Status { get; set; }
    public string? Remark { get; set; }
}

public class AppointmentQueryDto : PagedQueryDto
{
    public int? ClinicId { get; set; }
    public int? DoctorId { get; set; }
    public int? PatientId { get; set; }
    public int? Status { get; set; }
    public int? Type { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
