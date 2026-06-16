
namespace DentalClinic.Domain.Entities;

public class Prescription
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string PrescriptionNo { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public decimal TotalAmount { get; set; }
    public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Patient? Patient { get; set; }
    public Appointment? Appointment { get; set; }
    public Doctor? Doctor { get; set; }
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}

public class PrescriptionItem
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Usage { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount => UnitPrice * Quantity;
    public string? Remark { get; set; }

    public Prescription? Prescription { get; set; }
}

public enum PrescriptionStatus
{
    Pending = 1,
    Dispensed = 2,
    Paid = 3,
    Cancelled = 4
}
