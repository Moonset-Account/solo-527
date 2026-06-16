
namespace DentalClinic.Domain.Entities;

public class Appointment
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int ClinicId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public AppointmentType Type { get; set; } = AppointmentType.Initial;
    public string? ChiefComplaint { get; set; }
    public string? Remark { get; set; }
    public int? ScheduleSlotId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public Clinic? Clinic { get; set; }
    public ScheduleSlot? ScheduleSlot { get; set; }
    public ICollection<ChiefComplaint> ChiefComplaintRecords { get; set; } = new List<ChiefComplaint>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
    public ICollection<FeeItem> FeeItems { get; set; } = new List<FeeItem>();
    public FollowUp? FollowUp { get; set; }
}

public enum AppointmentStatus
{
    Pending = 1,
    Confirmed = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5,
    NoShow = 6
}

public enum AppointmentType
{
    Initial = 1,
    FollowUp = 2,
    Recheck = 3,
    Emergency = 4
}
