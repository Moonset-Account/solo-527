
namespace PrintingFactory.Domain.Entities;

public class QualityInspection
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public string Inspector { get; set; } = string.Empty;
    public DateTime InspectionDate { get; set; }
    public InspectionResult Result { get; set; }
    public int InspectedQuantity { get; set; }
    public int PassedQuantity { get; set; }
    public int FailedQuantity { get; set; }
    public string? CheckItems { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public QualityIssue? QualityIssue { get; set; }
}

public enum InspectionResult
{
    Pass,
    Fail,
    PartialPass,
    Pending
}
