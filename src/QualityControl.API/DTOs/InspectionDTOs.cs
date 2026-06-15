namespace QualityControl.API.DTOs;

public class QualityInspectionDTO
{
    public int Id { get; set; }
    public string InspectionNumber { get; set; } = string.Empty;
    public int SessionId { get; set; }
    public string? SessionNumber { get; set; }
    public string? SessionTitle { get; set; }
    public int InspectorId { get; set; }
    public string? InspectorName { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public string? OverallComment { get; set; }
    public decimal TotalScore { get; set; }
    public decimal MaxScore { get; set; }
    public decimal ScorePercentage { get; set; }
    public string? ImprovementSuggestion { get; set; }
    public bool IsRequiresRetrain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? RelatedTicketId { get; set; }
    public List<InspectionItemDTO> InspectionItems { get; set; } = new();
}

public class InspectionItemDTO
{
    public int Id { get; set; }
    public int InspectionId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal MaxScore { get; set; }
    public decimal Score { get; set; }
    public bool IsDeducted { get; set; }
    public string? DeductionReason { get; set; }
    public int SortOrder { get; set; }
}

public class CreateInspectionDTO
{
    public int SessionId { get; set; }
    public int InspectorId { get; set; }
    public int TemplateId { get; set; }
}

public class UpdateInspectionDTO
{
    public int Id { get; set; }
    public string? OverallComment { get; set; }
    public string? ImprovementSuggestion { get; set; }
    public bool IsRequiresRetrain { get; set; }
    public List<UpdateInspectionItemDTO> Items { get; set; } = new();
}

public class UpdateInspectionItemDTO
{
    public int Id { get; set; }
    public decimal Score { get; set; }
    public string? DeductionReason { get; set; }
}

public class InspectionQueryDTO : PagedQuery
{
    public int? InspectorId { get; set; }
    public int? AgentId { get; set; }
    public int? Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public decimal? MinScore { get; set; }
    public decimal? MaxScore { get; set; }
}

public class InspectionTemplateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int Version { get; set; }
    public string? ApplicableDepartment { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<InspectionTemplateItemDTO> Items { get; set; } = new();
}

public class InspectionTemplateItemDTO
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal MaxScore { get; set; }
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
}

public class InspectionStatisticsDTO
{
    public int TotalInspections { get; set; }
    public int CompletedInspections { get; set; }
    public int PendingInspections { get; set; }
    public decimal AverageScore { get; set; }
    public decimal PassRate { get; set; }
    public int RequiresRetrainCount { get; set; }
    public List<CategoryScoreDTO>? CategoryScores { get; set; }
    public List<AgentRankDTO>? AgentRanks { get; set; }
}

public class CategoryScoreDTO
{
    public string Category { get; set; } = string.Empty;
    public decimal AverageScore { get; set; }
    public decimal MaxScore { get; set; }
}

public class AgentRankDTO
{
    public int AgentId { get; set; }
    public string? AgentName { get; set; }
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public decimal AverageScore { get; set; }
    public int InspectionCount { get; set; }
}
