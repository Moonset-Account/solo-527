
namespace DentalClinic.Domain.Entities;

public class FeeItem
{
    public int Id { get; set; }
    public int? AppointmentId { get; set; }
    public int? PrescriptionId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public FeeItemCategory Category { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Amount => UnitPrice * Quantity;
    public string? Remark { get; set; }
    public FeeItemStatus Status { get; set; } = FeeItemStatus.Unpaid;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }

    public Appointment? Appointment { get; set; }
    public Prescription? Prescription { get; set; }
}

public enum FeeItemCategory
{
    Registration = 1,
    Examination = 2,
    Treatment = 3,
    Medicine = 4,
    Surgery = 5,
    Other = 99
}

public enum FeeItemStatus
{
    Unpaid = 1,
    Paid = 2,
    Refunded = 3,
    Waived = 4
}
