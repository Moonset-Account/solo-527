using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class AllocationRequest
{
    public int Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public int SourceWarehouseId { get; set; }
    public Warehouse? SourceWarehouse { get; set; }
    public int TargetWarehouseId { get; set; }
    public Warehouse? TargetWarehouse { get; set; }
    public int MedicineId { get; set; }
    public Medicine? Medicine { get; set; }
    public int? BatchId { get; set; }
    public MedicineBatch? Batch { get; set; }
    public decimal Quantity { get; set; }
    public string? Reason { get; set; }
    public AllocationStatus Status { get; set; } = AllocationStatus.Pending;
    public int RequestedByUserId { get; set; }
    public User? RequestedByUser { get; set; }
    public int? ApprovedByUserId { get; set; }
    public User? ApprovedByUser { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public ReceiptStatus? ReceiptStatus { get; set; }
    public DateTime? ReceiptDate { get; set; }
    public int? ReceivedByUserId { get; set; }
    public User? ReceivedByUser { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
