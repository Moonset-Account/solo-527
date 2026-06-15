namespace QualityControl.API.DTOs;

public class KnowledgeBaseDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public bool IsExpired { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int ViewCount { get; set; }
    public int UseCount { get; set; }
    public int HelpfulCount { get; set; }
    public int NotHelpfulCount { get; set; }
    public string? Remark { get; set; }
    public string? ProcessingResult { get; set; }
    public int? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public int? ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime? LastReviewAt { get; set; }
    public string? Tags { get; set; }
    public int DaysUntilExpiry => ExpiryDate.HasValue ? (int)(ExpiryDate.Value - DateTime.Now).TotalDays : -1;
}

public class KnowledgeBaseQueryDTO : PagedQuery
{
    public string? Category { get; set; }
    public int? Status { get; set; }
    public bool? IsExpired { get; set; }
    public bool? NeedReview { get; set; }
    public int? AuthorId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}

public class CreateKnowledgeBaseDTO
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Category { get; set; } = string.Empty;
    public int? AuthorId { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Tags { get; set; }
    public string? Remark { get; set; }
}

public class UpdateKnowledgeBaseDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Status { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Remark { get; set; }
    public string? ProcessingResult { get; set; }
    public string? Tags { get; set; }
    public int? ReviewerId { get; set; }
}

public class KnowledgeReviewRecordDTO
{
    public int Id { get; set; }
    public int KnowledgeBaseId { get; set; }
    public int ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public int Result { get; set; }
    public string? ResultText { get; set; }
    public string? Comment { get; set; }
    public string? ProcessingResult { get; set; }
    public string? CustomerSatisfaction { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class AddKnowledgeReviewDTO
{
    public int KnowledgeBaseId { get; set; }
    public int ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
    public int Result { get; set; }
    public string? Comment { get; set; }
    public string? ProcessingResult { get; set; }
    public string? CustomerSatisfaction { get; set; }
}

public class KnowledgeStatisticsDTO
{
    public int TotalKnowledge { get; set; }
    public int PublishedKnowledge { get; set; }
    public int ExpiredKnowledge { get; set; }
    public int NeedReviewKnowledge { get; set; }
    public int TotalViews { get; set; }
    public int TotalUses { get; set; }
    public double HelpfulRate { get; set; }
    public List<CategoryKnowledgeCountDTO>? CategoryCounts { get; set; }
}

public class CategoryKnowledgeCountDTO
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ServiceRatingDTO
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public string? SessionNumber { get; set; }
    public int CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int AgentId { get; set; }
    public string? AgentName { get; set; }
    public int OverallRating { get; set; }
    public int? ResponseSpeedRating { get; set; }
    public int? ProfessionalismRating { get; set; }
    public int? AttitudeRating { get; set; }
    public int? ProblemResolutionRating { get; set; }
    public string? Comment { get; set; }
    public bool IsSolved { get; set; }
    public bool WouldRecommend { get; set; }
    public string? ImprovementSuggestion { get; set; }
    public DateTime CreatedAt { get; set; }
}
