
namespace DentalClinic.Domain.Entities;

public class Patient
{
    public int Id { get; set; }
    public int ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IdCard { get; set; }
    public string? Address { get; set; }
    public string? Remark { get; set; }
    public PatientStatus Status { get; set; } = PatientStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Clinic? Clinic { get; set; }
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<ChiefComplaint> ChiefComplaints { get; set; } = new List<ChiefComplaint>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
}

public enum PatientStatus
{
    Active = 1,
    Inactive = 2,
    Lost = 3
}
