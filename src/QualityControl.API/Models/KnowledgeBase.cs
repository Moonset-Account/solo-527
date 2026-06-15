using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class KnowledgeBase
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Summary { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public KnowledgeStatus Status { get; set; }

    public bool IsExpired { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public int ViewCount { get; set; }

    public int UseCount { get; set; }

    public int HelpfulCount { get; set; }

    public int NotHelpfulCount { get; set; }

    [MaxLength(2000)]
    public string? Remark { get; set; }

    [MaxLength(500)]
    public string? ProcessingResult { get; set; }

    public int? AuthorId { get; set; }

    public Agent? Author { get; set; }

    public int? ReviewerId { get; set; }

    public Agent? Reviewer { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public DateTime? LastReviewAt { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }

    public ICollection<KnowledgeReviewRecord> ReviewRecords { get; set; } = new List<KnowledgeReviewRecord>();
}

public enum KnowledgeStatus
{
    Draft = 0,
    UnderReview = 1,
    Published = 2,
    NeedsUpdate = 3,
    Archived = 4,
    Expired = 5
}

public class KnowledgeReviewRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int KnowledgeBaseId { get; set; }

    public KnowledgeBase? KnowledgeBase { get; set; }

    [Required]
    public int ReviewerId { get; set; }

    [MaxLength(200)]
    public string? ReviewerName { get; set; }

    public ReviewResult Result { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    [MaxLength(500)]
    public string? ProcessingResult { get; set; }

    [MaxLength(200)]
    public string? CustomerSatisfaction { get; set; }

    public DateTime ReviewedAt { get; set; }
}

public enum ReviewResult
{
    Approved = 0,
    NeedsRevision = 1,
    Rejected = 2,
    Expired = 3
}
