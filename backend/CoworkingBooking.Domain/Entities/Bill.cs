using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class Bill : EntityBase
{
    public string BillNo { get; set; } = string.Empty;
    public Guid ContractId { get; set; }
    public string BillType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public BillStatus Status { get; set; } = BillStatus.Unpaid;
    public DateTime BillingDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Period { get; set; }
    public string? Remarks { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? PaymentRefNo { get; set; }
    public string? TenantName { get; set; }

    public LeaseContract Contract { get; set; } = null!;
}
