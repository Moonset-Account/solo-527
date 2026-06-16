
namespace DentalClinic.Application.DTOs;

public class ChiefComplaintDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string? PatientName { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public DateTime VisitDate { get; set; }
    public string? VisitDateText { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChiefComplaintCreateDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public DateTime VisitDate { get; set; }
}
