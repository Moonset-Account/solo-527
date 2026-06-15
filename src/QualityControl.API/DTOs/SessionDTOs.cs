namespace QualityControl.API.DTOs;

public class SessionDTO
{
    public int Id { get; set; }
    public string SessionNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int AgentId { get; set; }
    public string? AgentName { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public string? ProblemDescription { get; set; }
    public int? RelatedTicketId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? FirstResponseAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public double? ResponseTimeSeconds { get; set; }
    public string? ResponseTimeDisplay { get; set; }
    public double? ResolutionTimeSeconds { get; set; }
    public string? Channel { get; set; }
    public string? Tags { get; set; }
    public bool IsInspected { get; set; }
    public DateTime? InspectedAt { get; set; }
    public int? InspectorId { get; set; }
    public string? InspectorName { get; set; }
    public decimal? InspectionScore { get; set; }
    public int MessageCount { get; set; }
    public int AttachmentCount { get; set; }
    public bool HasRating { get; set; }
    public int? RatingScore { get; set; }
}

public class SessionQueryDTO : PagedQuery
{
    public int? AgentId { get; set; }
    public int? CustomerId { get; set; }
    public int? Status { get; set; }
    public string? Channel { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool? IsInspected { get; set; }
    public long? MinResponseTime { get; set; }
    public long? MaxResponseTime { get; set; }
    public string? Tag { get; set; }
}

public class CreateSessionDTO
{
    public int CustomerId { get; set; }
    public int AgentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ProblemDescription { get; set; }
    public string? Channel { get; set; }
    public string? Tags { get; set; }
    public string? InitialMessage { get; set; }
    public List<AttachmentDTO>? Attachments { get; set; }
}

public class SessionMessageDTO
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int SenderType { get; set; }
    public string? SenderTypeText { get; set; }
    public int? SenderId { get; set; }
    public string? SenderName { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class AddMessageDTO
{
    public int SessionId { get; set; }
    public int SenderType { get; set; }
    public int? SenderId { get; set; }
    public string? SenderName { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<AttachmentDTO>? Attachments { get; set; }
}

public class AttachmentDTO
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? UploaderName { get; set; }
}

public class SessionStatisticsDTO
{
    public int TotalSessions { get; set; }
    public int PendingSessions { get; set; }
    public int InProgressSessions { get; set; }
    public int ResolvedSessions { get; set; }
    public int InspectedSessions { get; set; }
    public int UninspectedSessions { get; set; }
    public double AverageResponseTime { get; set; }
    public double AverageResolutionTime { get; set; }
    public decimal AverageInspectionScore { get; set; }
    public double CustomerSatisfactionRate { get; set; }
    public int TodaySessions { get; set; }
}

public class RandomInspectionDTO
{
    public int Count { get; set; } = 5;
    public int? DepartmentId { get; set; }
    public int? AgentId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool OnlyUninspected { get; set; } = true;
}

public class ExportSessionDTO
{
    public int? AgentId { get; set; }
    public int? Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public long? MinResponseTime { get; set; }
    public long? MaxResponseTime { get; set; }
    public string ExportFormat { get; set; } = "csv";
}
