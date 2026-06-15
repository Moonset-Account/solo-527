using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class Ticket
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string TicketNumber { get; set; } = string.Empty;

    [Required]
    public TicketType Type { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public TicketPriority Priority { get; set; }

    [Required]
    public TicketStatus Status { get; set; }

    [Required]
    public int AssigneeDepartmentId { get; set; }

    public Department? AssigneeDepartment { get; set; }

    public int? AssigneeId { get; set; }

    public Agent? Assignee { get; set; }

    public int? CreatorId { get; set; }

    public Agent? Creator { get; set; }

    public int? CustomerId { get; set; }

    public Customer? Customer { get; set; }

    public int? RelatedSessionId { get; set; }

    public Session? RelatedSession { get; set; }

    public int? RelatedInspectionId { get; set; }

    public QualityInspection? RelatedInspection { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    [MaxLength(2000)]
    public string? Resolution { get; set; }

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
}

public enum TicketType
{
    QualityIssue = 0,
    ServiceComplaint = 1,
    KnowledgeRequest = 2,
    SystemBug = 3,
    FeatureRequest = 4,
    Other = 5
}

public enum TicketPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum TicketStatus
{
    Open = 0,
    InProgress = 1,
    Pending = 2,
    Resolved = 3,
    Closed = 4,
    Reopened = 5
}

public class TicketComment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TicketId { get; set; }

    public Ticket? Ticket { get; set; }

    [Required]
    public int CommenterId { get; set; }

    [MaxLength(200)]
    public string? CommenterName { get; set; }

    [MaxLength(50)]
    public string? CommenterRole { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public bool IsInternal { get; set; }

    public DateTime CreatedAt { get; set; }

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
