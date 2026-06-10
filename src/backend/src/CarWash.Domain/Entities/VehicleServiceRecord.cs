using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class VehicleServiceRecord
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string RecordNo { get; set; } = string.Empty;

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    public Guid VehicleId { get; set; }

    public Guid? AppointmentId { get; set; }

    public Guid? ServicePackageId { get; set; }

    public Guid? TechnicianId { get; set; }

    public Guid? WorkstationId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ServiceName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public int DurationMinutes { get; set; }

    public int MileageIn { get; set; }

    public int MileageOut { get; set; }

    [MaxLength(1000)]
    public string? ServiceItems { get; set; }

    [MaxLength(1000)]
    public string? InspectionResults { get; set; }

    [MaxLength(1000)]
    public string? Recommendations { get; set; }

    [MaxLength(500)]
    public string? CustomerFeedback { get; set; }

    public int? Rating { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public Guid? OperatorId { get; set; }

    [MaxLength(50)]
    public string? OperatorName { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer? Customer { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    [ForeignKey(nameof(ServicePackageId))]
    public ServicePackage? ServicePackage { get; set; }

    [ForeignKey(nameof(TechnicianId))]
    public Technician? Technician { get; set; }

    [ForeignKey(nameof(WorkstationId))]
    public Workstation? Workstation { get; set; }
}
