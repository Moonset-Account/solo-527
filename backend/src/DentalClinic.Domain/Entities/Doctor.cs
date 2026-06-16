
namespace DentalClinic.Domain.Entities;

public class Doctor
{
    public int Id { get; set; }
    public int ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Introduction { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Clinic? Clinic { get; set; }
    public ICollection&lt;Appointment&gt; Appointments { get; set; } = new List&lt;Appointment&gt;();
    public ICollection&lt;ScheduleSlot&gt; ScheduleSlots { get; set; } = new List&lt;ScheduleSlot&gt;();
}
