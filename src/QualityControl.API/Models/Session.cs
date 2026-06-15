using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QualityControl.API.Models;

public class Session
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SessionNumber { get; set; } = string.Empty;

    [Required]
    public int CustomerId { get; set; }

    public Customer? Customer { get; set; }

    [Required]
    public int AgentId { get; set; }

    public Agent? Agent { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public SessionStatus Status { get; set; }

    [MaxLength(2000)]
    public string? ProblemDescription { get; set; }

    public int? RelatedTicketId { get; set; }

    public Ticket? RelatedTicket { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? FirstResponseAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public double? ResponseTimeSeconds { get; set; }

    public double? ResolutionTimeSeconds { get; set; }

    [MaxLength(100)]
    public string? Channel { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }

    public bool IsInspected { get; set; }

    public DateTime? InspectedAt { get; set; }

    public int? InspectorId { get; set; }

    public Agent? Inspector { get; set; }

    public decimal? InspectionScore { get; set; }

    public ICollection<SessionMessage> Messages { get; set; } = new List<SessionMessage>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public QualityInspection? Inspection { get; set; }
    public ServiceRating? Rating { get; set; }
}

public enum SessionStatus
{
    Pending = 0,
    InProgress = 1,
    WaitingCustomer = 2,
    Resolved = 3,
    Closed = 4
}
