using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class PartsShortageNode
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid PartsShortageId { get; set; }

    [Required]
    [MaxLength(100)]
    public string PartName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? PartCode { get; set; }

    [MaxLength(50)]
    public string? PartType { get; set; }

    [MaxLength(100)]
    public string? Specification { get; set; }

    [MaxLength(50)]
    public string? Brand { get; set; }

    public int RequiredQuantity { get; set; }

    public int AvailableQuantity { get; set; }

    public int ShortageQuantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalPrice { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    public DateTime? ExpectedArrivalDate { get; set; }

    public DateTime? ArrivedAt { get; set; }

    [MaxLength(500)]
    public string? Supplier { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public int SortOrder { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(PartsShortageId))]
    public PartsShortage? PartsShortage { get; set; }
}
