using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class ExceptionRecordDTO
{
    public int Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public ExceptionType ExceptionType { get; set; }
    public int? AllocationRequestId { get; set; }
    public string? AllocationRequestNumber { get; set; }
    public int? SupplierReplyId { get; set; }
    public string? SupplierName { get; set; }
    public int? MedicineId { get; set; }
    public string? MedicineName { get; set; }
    public string? MedicineCode { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string? DelayReason { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public int? ProcessingDurationHours { get; set; }
    public int? ResponsibleUserId { get; set; }
    public string? ResponsibleUserName { get; set; }
    public string? ResponsibleUserRealName { get; set; }
    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public bool IsResolved { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ExceptionQueryDTO
{
    public string? Keyword { get; set; }
    public ExceptionType? ExceptionType { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public bool? IsResolved { get; set; }
    public int? ResponsibleUserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ExceptionCreateDTO
{
    public ExceptionType ExceptionType { get; set; }
    public int? AllocationRequestId { get; set; }
    public int? SupplierReplyId { get; set; }
    public int? MedicineId { get; set; }
    public int? SupplierId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string? DelayReason { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public int? ResponsibleUserId { get; set; }
    public int CreatedByUserId { get; set; }
}

public class ExceptionResolveDTO
{
    public int ExceptionRecordId { get; set; }
    public string ResolutionNotes { get; set; } = string.Empty;
    public int ResolvedByUserId { get; set; }
    public int? ProcessingDurationHours { get; set; }
}

public class ExceptionAssignResponsibleDTO
{
    public int ResponsibleUserId { get; set; }
    public int AssignedByUserId { get; set; }
}
