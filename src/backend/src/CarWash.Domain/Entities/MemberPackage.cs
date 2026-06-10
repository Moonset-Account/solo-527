using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class MemberPackage
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DiscountPrice { get; set; }

    public int ValidityDays { get; set; }

    public int TotalTimes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RechargeAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BonusAmount { get; set; }

    public int MemberLevel { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(1000)]
    public string? Benefits { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? ServicePackageId { get; set; }

    [ForeignKey(nameof(ServicePackageId))]
    public ServicePackage? ServicePackage { get; set; }

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
