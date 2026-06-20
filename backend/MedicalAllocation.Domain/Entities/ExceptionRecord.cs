using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class ExceptionRecord
{
    public int Id { get; set; }
    public string RecordNumber { get; set; } = string.Empty;
    public ExceptionType ExceptionType { get; set; }
    public int? AllocationRequestId { get; set; }
    public AllocationRequest? AllocationRequest { get; set; }
    public int? SupplierReplyId { get; set; }
    public SupplierReply? SupplierReply { get; set; }
    public int? MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; } = RiskLevel.Medium;
    public string? DelayReason { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public int? ProcessingDurationHours { get; set; }
    public int? ResponsibleUserId { get; set; }
    public User? ResponsibleUser { get; set; }
    public int? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public bool IsResolved { get; set; } = false;
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
