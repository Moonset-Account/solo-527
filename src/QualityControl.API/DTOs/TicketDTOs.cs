namespace QualityControl.API.DTOs;

public class TicketDTO
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int Type { get; set; }
    public string? TypeText { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public string? PriorityText { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public int AssigneeDepartmentId { get; set; }
    public string? AssigneeDepartmentName { get; set; }
    public int? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public int? CreatorId { get; set; }
    public string? CreatorName { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? RelatedSessionId { get; set; }
    public string? RelatedSessionNumber { get; set; }
    public int? RelatedInspectionId { get; set; }
    public string? RelatedInspectionNumber { get; set; }
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? Resolution { get; set; }
    public int CommentCount { get; set; }
    public int AttachmentCount { get; set; }
}

public class TicketQueryDTO : PagedQuery
{
    public int? Type { get; set; }
    public int? Priority { get; set; }
    public int? Status { get; set; }
    public int? AssigneeDepartmentId { get; set; }
    public int? AssigneeId { get; set; }
    public int? CreatorId { get; set; }
    public int? CustomerId { get; set; }
    public int? RelatedSessionId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}

public class CreateTicketDTO
{
    public int Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; } = 1;
    public int AssigneeDepartmentId { get; set; }
    public int? AssigneeId { get; set; }
    public int? CreatorId { get; set; }
    public int? CustomerId { get; set; }
    public int? RelatedSessionId { get; set; }
    public int? RelatedInspectionId { get; set; }
    public string? Tags { get; set; }
    public DateTime? DueDate { get; set; }
    public List<AttachmentDTO>? Attachments { get; set; }
}

public class UpdateTicketStatusDTO
{
    public int Id { get; set; }
    public int Status { get; set; }
    public string? Remark { get; set; }
    public int OperatorId { get; set; }
}

public class TicketCommentDTO
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int CommenterId { get; set; }
    public string? CommenterName { get; set; }
    public string? CommenterRole { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class AddTicketCommentDTO
{
    public int TicketId { get; set; }
    public int CommenterId { get; set; }
    public string? CommenterName { get; set; }
    public string? CommenterRole { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = true;
    public List<AttachmentDTO>? Attachments { get; set; }
}
