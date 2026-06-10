using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarWash.Domain.Entities;

public class Technician
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string EmployeeNo { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; }

    public int Level { get; set; }

    [MaxLength(500)]
    public string? Skills { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BaseSalary { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal CommissionRate { get; set; }

    public bool IsActive { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public int TotalServices { get; set; }

    public double AverageRating { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<VehicleServiceRecord> ServiceRecords { get; set; } = new List<VehicleServiceRecord>();

    public ICollection<Workstation> Workstations { get; set; } = new List<Workstation>();
}
