using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class InspectionItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int InspectionId { get; set; }

    public QualityInspection? Inspection { get; set; }

    [Required]
    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public decimal MaxScore { get; set; }

    public decimal Score { get; set; }

    public bool IsDeducted { get; set; }

    [MaxLength(1000)]
    public string? DeductionReason { get; set; }

    public int SortOrder { get; set; }
}

public class InspectionTemplate
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public int Version { get; set; }

    [MaxLength(100)]
    public string? ApplicableDepartment { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ICollection<InspectionTemplateItem> Items { get; set; } = new List<InspectionTemplateItem>();
}

public class InspectionTemplateItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TemplateId { get; set; }

    public InspectionTemplate? Template { get; set; }

    [Required]
    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    public decimal MaxScore { get; set; }

    public int SortOrder { get; set; }

    public bool IsRequired { get; set; }
}
