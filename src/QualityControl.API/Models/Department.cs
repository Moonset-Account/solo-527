using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class Department
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int? ManagerId { get; set; }

    public Agent? Manager { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public ICollection<Agent> Agents { get; set; } = new List<Agent>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
