using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class PartsShortage
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ShortageNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Priority { get; set; }

    public Guid? VehicleServiceRecordId { get; set; }

    public Guid? VehicleId { get; set; }

    public Guid? CustomerId { get; set; }

    [MaxLength(50)]
    public string? ReporterId { get; set; }

    [MaxLength(50)]
    public string? ReporterName { get; set; }

    [MaxLength(50)]
    public string? HandlerId { get; set; }

    [MaxLength(50)]
    public string? HandlerName { get; set; }

    public DateTime? ExpectedResolveDate { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(1000)]
    public string? Resolution { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(VehicleServiceRecordId))]
    public VehicleServiceRecord? VehicleServiceRecord { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    public ICollection<PartsShortageNode> Nodes { get; set; } = new List<PartsShortageNode>();
}
