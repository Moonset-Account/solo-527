using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class Appointment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string AppointmentNo { get; set; } = string.Empty;

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    public Guid VehicleId { get; set; }

    [Required]
    public Guid ServicePackageId { get; set; }

    public Guid? TechnicianId { get; set; }

    public Guid? WorkstationId { get; set; }

    [Required]
    public DateTime AppointmentDate { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ActualPrice { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime? ArrivalTime { get; set; }

    public DateTime? StartServiceTime { get; set; }

    public DateTime? EndServiceTime { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    [ForeignKey(nameof(ServicePackageId))]
    public ServicePackage? ServicePackage { get; set; }

    [ForeignKey(nameof(TechnicianId))]
    public Technician? Technician { get; set; }

    [ForeignKey(nameof(WorkstationId))]
    public Workstation? Workstation { get; set; }

    public ICollection<VehicleServiceRecord> ServiceRecords { get; set; } = new List<VehicleServiceRecord>();

    public ICollection<CashierOrder> CashierOrders { get; set; } = new List<CashierOrder>();
}
