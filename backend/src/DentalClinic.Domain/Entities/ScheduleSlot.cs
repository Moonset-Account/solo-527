
namespace DentalClinic.Domain.Entities;

public class ScheduleSlot
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public int ClinicId { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public int AvailableSlots => TotalSlots - BookedSlots;
    public ScheduleSlotStatus Status { get; set; } = ScheduleSlotStatus.Available;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Doctor? Doctor { get; set; }
    public Clinic? Clinic { get; set; }
    public ICollection&lt;Appointment&gt; Appointments { get; set; } = new List&lt;Appointment&gt;();
}

public enum ScheduleSlotStatus
{
    Available = 1,
    PartiallyBooked = 2,
    FullyBooked = 3,
    Closed = 4
}
