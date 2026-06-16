
namespace DentalClinic.Domain.Entities;

public class Clinic
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public ICollection&lt;Doctor&gt; Doctors { get; set; } = new List&lt;Doctor&gt;();
    public ICollection&lt;Patient&gt; Patients { get; set; } = new List&lt;Patient&gt;();
}
