using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class CashierOrder
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string OrderNo { get; set; } = string.Empty;

    [Required]
    public Guid CustomerId { get; set; }

    public Guid? AppointmentId { get; set; }

    public Guid? VehicleId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RefundAmount { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? OrderType { get; set; }

    [MaxLength(20)]
    public string? Source { get; set; }

    public bool IsMemberPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BalanceUsed { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public Guid? CashierId { get; set; }

    [MaxLength(50)]
    public string? CashierName { get; set; }

    public DateTime? PaidTime { get; set; }

    public DateTime? CompletedTime { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    public ICollection<CashierOrderItem> OrderItems { get; set; } = new List<CashierOrderItem>();

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
