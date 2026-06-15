using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class QualityInspection
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string InspectionNumber { get; set; } = string.Empty;

    [Required]
    public int SessionId { get; set; }

    public Session? Session { get; set; }

    [Required]
    public int InspectorId { get; set; }

    public Agent? Inspector { get; set; }

    [Required]
    public InspectionStatus Status { get; set; }

    [MaxLength(2000)]
    public string? OverallComment { get; set; }

    public decimal TotalScore { get; set; }

    public decimal MaxScore { get; set; }

    public decimal ScorePercentage => MaxScore > 0 ? TotalScore / MaxScore * 100 : 0;

    [MaxLength(500)]
    public string? ImprovementSuggestion { get; set; }

    public bool IsRequiresRetrain { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int? RelatedTicketId { get; set; }

    public Ticket? RelatedTicket { get; set; }

    public ICollection<InspectionItem> InspectionItems { get; set; } = new List<InspectionItem>();
}

public enum InspectionStatus
{
    Draft = 0,
    InProgress = 1,
    Completed = 2,
    Appeal = 3,
    Appealed = 4
}
