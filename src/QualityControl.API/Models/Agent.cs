using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class Agent
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    public int DepartmentId { get; set; }

    public Department? Department { get; set; }

    [Required]
    public AgentRole Role { get; set; }

    [MaxLength(100)]
    public string? Position { get; set; }

    public DateTime HireDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<QualityInspection> InspectionsAsInspector { get; set; } = new List<QualityInspection>();
    public ICollection<Ticket> TicketsAsAssignee { get; set; } = new List<Ticket>();
    public ICollection<Ticket> TicketsAsCreator { get; set; } = new List<Ticket>();
}

public enum AgentRole
{
    Agent = 0,
    SeniorAgent = 1,
    TeamLeader = 2,
    Supervisor = 3,
    QualityInspector = 4,
    Admin = 5
}
