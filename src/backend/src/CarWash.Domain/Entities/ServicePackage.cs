using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class ServicePackage
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

    [Column(TypeName = "decimal(18,2)")]
    public decimal MemberPrice { get; set; }

    public int DurationMinutes { get; set; }

    [MaxLength(20)]
    public string? Category { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(1000)]
    public string? ServiceItems { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<CashierOrderItem> OrderItems { get; set; } = new List<CashierOrderItem>();

    public ICollection<MemberPackage> MemberPackages { get; set; } = new List<MemberPackage>();

    public ICollection<VehicleServiceRecord> ServiceRecords { get; set; } = new List<VehicleServiceRecord>();
}
