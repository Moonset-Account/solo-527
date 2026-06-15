
namespace PrintingFactory.Domain.Entities;

public class QualityIssue
{
    public int Id { get; set; }
    public int QualityInspectionId { get; set; }
    public QualityInspection? QualityInspection { get; set; }
    public string AffectedScope { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string HandlingPath { get; set; } = string.Empty;
    public string CorrectiveAction { get; set; } = string.Empty;
    public string PreventiveAction { get; set; } = string.Empty;
    public string ReviewNotes { get; set; } = string.Empty;
    public QualityIssueStatus Status { get; set; } = QualityIssueStatus.Open;
    public string Handler { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum QualityIssueStatus
{
    Open,
    Investigating,
    Handling,
    Reviewed,
    Closed
}
