using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class DiscrepancyRecord
{
    public int Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public int AllocationRequestId { get; set; }
    public AllocationRequest? AllocationRequest { get; set; }
    public DiscrepancyType DiscrepancyType { get; set; }
    public decimal ExpectedQuantity { get; set; }
    public decimal ActualQuantity { get; set; }
    public decimal DifferenceQuantity { get; set; }
    public string? Description { get; set; }
    public DiscrepancyStatus Status { get; set; } = DiscrepancyStatus.Open;
    public int? ResponsibleUserId { get; set; }
    public User? ResponsibleUser { get; set; }
    public string? InvestigationResult { get; set; }
    public string? ResolutionAction { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
