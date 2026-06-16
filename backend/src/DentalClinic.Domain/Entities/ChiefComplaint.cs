
namespace DentalClinic.Domain.Entities;

public class ChiefComplaint
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public DateTime VisitDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Patient? Patient { get; set; }
    public Appointment? Appointment { get; set; }
    public Doctor? Doctor { get; set; }
}
