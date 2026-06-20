using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class AllocationRequestDTO
{
    public int Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public int SourceWarehouseId { get; set; }
    public string? SourceWarehouseName { get; set; }
    public int TargetWarehouseId { get; set; }
    public string? TargetWarehouseName { get; set; }
    public int MedicineId { get; set; }
    public string? MedicineName { get; set; }
    public string? MedicineCode { get; set; }
    public int? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public decimal Quantity { get; set; }
    public string? Reason { get; set; }
    public AllocationStatus Status { get; set; }
    public int RequestedByUserId { get; set; }
    public string? RequestedByUserName { get; set; }
    public int? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public ReceiptStatus? ReceiptStatus { get; set; }
    public DateTime? ReceiptDate { get; set; }
    public int? ReceivedByUserId { get; set; }
    public string? ReceivedByUserName { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AllocationCreateDTO
{
    public int SourceWarehouseId { get; set; }
    public int TargetWarehouseId { get; set; }
    public int MedicineId { get; set; }
    public int? BatchId { get; set; }
    public decimal Quantity { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Remarks { get; set; }
    public int RequestedByUserId { get; set; }
}

public class AllocationApproveDTO
{
    public int AllocationRequestId { get; set; }
    public bool IsApproved { get; set; }
    public int ApprovedByUserId { get; set; }
    public string? Remarks { get; set; }
}

public class AllocationReceiveDTO
{
    public int AllocationRequestId { get; set; }
    public ReceiptStatus ReceiptStatus { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public int ReceivedByUserId { get; set; }
    public string? Remarks { get; set; }
}
