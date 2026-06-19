using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class LeaseContract : EntityBase
{
    public string ContractNo { get; set; } = string.Empty;
    public Guid SpaceId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantPhone { get; set; } = string.Empty;
    public string? TenantIdCard { get; set; }
    public string? TenantCompany { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal DepositAmount { get; set; }
    public int PaymentMonths { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public DateTime? SignedAt { get; set; }
    public Guid? SignedById { get; set; }
    public string? SignedByName { get; set; }
    public string? ContractFile { get; set; }
    public string? Terms { get; set; }
    public string? SpecialClauses { get; set; }
    public Guid? RelatedAppointmentId { get; set; }

    public CoworkingSpace Space { get; set; } = null!;
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
