using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class ServiceRating
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SessionId { get; set; }

    public Session? Session { get; set; }

    [Required]
    public int CustomerId { get; set; }

    public Customer? Customer { get; set; }

    [Required]
    public int AgentId { get; set; }

    public Agent? Agent { get; set; }

    public int OverallRating { get; set; }

    public int? ResponseSpeedRating { get; set; }

    public int? ProfessionalismRating { get; set; }

    public int? AttitudeRating { get; set; }

    public int? ProblemResolutionRating { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public bool IsSolved { get; set; }

    public bool WouldRecommend { get; set; }

    [MaxLength(500)]
    public string? ImprovementSuggestion { get; set; }

    public DateTime CreatedAt { get; set; }
}
