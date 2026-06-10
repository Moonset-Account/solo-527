using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class Payment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentNo { get; set; } = string.Empty;

    [Required]
    public Guid CustomerId { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? MemberPackageId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualAmount { get; set; }

    [Required]
    [MaxLength(20)]
    public string PaymentMethod { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PaymentType { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Status { get; set; }

    public DateTime PaymentTime { get; set; }

    [MaxLength(50)]
    public string? TransactionId { get; set; }

    [MaxLength(50)]
    public string? ThirdPartyNo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BalanceUsed { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? RechargeAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BonusAmount { get; set; }

    public int? MemberDaysAdded { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public Guid? CashierId { get; set; }

    [MaxLength(50)]
    public string? CashierName { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    [ForeignKey(nameof(MemberPackageId))]
    public MemberPackage? MemberPackage { get; set; }

    [ForeignKey(nameof(OrderId))]
    public CashierOrder? CashierOrder { get; set; }
}
