using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class Workstation
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Type { get; set; }

    public int Capacity { get; set; }

    [MaxLength(500)]
    public string? Equipment { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? CurrentTechnicianId { get; set; }

    [ForeignKey(nameof(CurrentTechnicianId))]
    public Technician? CurrentTechnician { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<VehicleServiceRecord> ServiceRecords { get; set; } = new List<VehicleServiceRecord>();
}
