using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class DiscrepancyRecordDTO
{
    public int Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public int AllocationRequestId { get; set; }
    public string? AllocationRequestNumber { get; set; }
    public string? SourceWarehouseName { get; set; }
    public string? TargetWarehouseName { get; set; }
    public string? MedicineName { get; set; }
    public string? MedicineCode { get; set; }
    public DiscrepancyType DiscrepancyType { get; set; }
    public decimal ExpectedQuantity { get; set; }
    public decimal ActualQuantity { get; set; }
    public decimal DifferenceQuantity { get; set; }
    public string? Description { get; set; }
    public DiscrepancyStatus Status { get; set; }
    public int? ResponsibleUserId { get; set; }
    public string? ResponsibleUserName { get; set; }
    public string? ResponsibleUserRealName { get; set; }
    public string? InvestigationResult { get; set; }
    public string? ResolutionAction { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByUserId { get; set; }
    public string? ResolvedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DiscrepancyQueryDTO
{
    public string? Keyword { get; set; }
    public DiscrepancyType? DiscrepancyType { get; set; }
    public DiscrepancyStatus? Status { get; set; }
    public int? ResponsibleUserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class DiscrepancyResolveDTO
{
    public int DiscrepancyRecordId { get; set; }
    public DiscrepancyStatus Status { get; set; }
    public string? InvestigationResult { get; set; }
    public string ResolutionAction { get; set; } = string.Empty;
    public int ResolvedByUserId { get; set; }
}

public class DiscrepancyAssignResponsibleDTO
{
    public int ResponsibleUserId { get; set; }
    public int AssignedByUserId { get; set; }
}

public class DiscrepancyCreateFromAllocationDTO
{
    public DiscrepancyRecordDTO Dto { get; set; } = new();
    public int CreatedByUserId { get; set; }
}
