using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class AuditLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TraceId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Operation { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? OperationType { get; set; }

    [MaxLength(100)]
    public string? EntityName { get; set; }

    public Guid? EntityId { get; set; }

    [MaxLength(50)]
    public string? UserId { get; set; }

    [MaxLength(50)]
    public string? UserName { get; set; }

    [MaxLength(50)]
    public string? UserRole { get; set; }

    [MaxLength(500)]
    public string? ModuleName { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "text")]
    public string? OldValue { get; set; }

    [Column(TypeName = "text")]
    public string? NewValue { get; set; }

    [MaxLength(200)]
    public string? ChangedFields { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(200)]
    public string? UserAgent { get; set; }

    [MaxLength(200)]
    public string? RequestUrl { get; set; }

    [MaxLength(10)]
    public string? HttpMethod { get; set; }

    public int? StatusCode { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? DurationMs { get; set; }

    [MaxLength(20)]
    public string? Level { get; set; }

    [MaxLength(500)]
    public string? ErrorMessage { get; set; }

    [Column(TypeName = "text")]
    public string? StackTrace { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    [MaxLength(50)]
    public string? CreatedBy { get; set; }
}
