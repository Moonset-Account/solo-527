using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Domain.Entities;

public class SupplierReply
{
    public int Id { get; set; }
    public int ReplenishmentSuggestionId { get; set; }
    public ReplenishmentSuggestion? ReplenishmentSuggestion { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public decimal QuotedQuantity { get; set; }
    public decimal QuotedUnitPrice { get; set; }
    public DateTime? PromisedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ProductionDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public SupplierReplyStatus Status { get; set; } = SupplierReplyStatus.Pending;
    public string? SupplierNotes { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime ReplyDueDate { get; set; }
    public DateTime? RepliedAt { get; set; }
    public int? RepliedByUserId { get; set; }
    public int? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? DelayReason { get; set; }
    public int? DelayDays { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
