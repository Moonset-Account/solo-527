using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Application.DTOs.Contract;

public class ContractDto
{
    public Guid Id { get; set; }
    public string ContractNo { get; set; } = string.Empty;
    public Guid SpaceId { get; set; }
    public string SpaceName { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string TenantPhone { get; set; } = string.Empty;
    public string? TenantCompany { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal DepositAmount { get; set; }
    public int PaymentMonths { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public ContractStatus Status { get; set; }
    public DateTime? SignedAt { get; set; }
    public string? SignedByName { get; set; }
    public string? ContractFile { get; set; }
    public string? Terms { get; set; }
    public string? SpecialClauses { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BillDto> Bills { get; set; } = new();
}

public class BillDto
{
    public Guid Id { get; set; }
    public string BillNo { get; set; } = string.Empty;
    public Guid ContractId { get; set; }
    public string BillType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public BillStatus Status { get; set; }
    public DateTime BillingDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Period { get; set; }
    public string? Remarks { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? TenantName { get; set; }
}

public class CreateContractRequest
{
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
    public string? Terms { get; set; }
    public string? SpecialClauses { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
}

public class SignContractRequest
{
    public string? ContractFile { get; set; }
    public string? Remarks { get; set; }
}

public class CreateBillRequest
{
    public Guid ContractId { get; set; }
    public string BillType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime BillingDate { get; set; }
    public DateTime DueDate { get; set; }
    public string? Period { get; set; }
    public string? Remarks { get; set; }
}

public class PayBillRequest
{
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentRefNo { get; set; }
    public string? Remarks { get; set; }
}

public class ContractQuery : Common.PagedQuery
{
    public ContractStatus? Status { get; set; }
    public Guid? SpaceId { get; set; }
    public string? TenantName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class BillQuery : Common.PagedQuery
{
    public BillStatus? Status { get; set; }
    public Guid? ContractId { get; set; }
    public string? TenantName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
