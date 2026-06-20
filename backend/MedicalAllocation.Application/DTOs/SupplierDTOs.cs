using MedicalAllocation.Domain.Enums;

namespace MedicalAllocation.Application.DTOs;

public class SupplierDTO
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BusinessLicense { get; set; } = string.Empty;
    public string GspCertificate { get; set; } = string.Empty;
    public int Rating { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SupplierReplyDTO
{
    public int Id { get; set; }
    public int ReplenishmentSuggestionId { get; set; }
    public string? ReplenishmentMedicineName { get; set; }
    public string? ReplenishmentWarehouseName { get; set; }
    public decimal? ReplenishmentSuggestedQuantity { get; set; }
    public int SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierCode { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public decimal QuotedQuantity { get; set; }
    public decimal QuotedUnitPrice { get; set; }
    public DateTime? PromisedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ProductionDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public SupplierReplyStatus Status { get; set; }
    public string? SupplierNotes { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime ReplyDueDate { get; set; }
    public DateTime? RepliedAt { get; set; }
    public int? RepliedByUserId { get; set; }
    public int? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? DelayReason { get; set; }
    public int? DelayDays { get; set; }
    public int? ProcessingDurationHours
    {
        get
        {
            if (RepliedAt.HasValue)
            {
                return (int)Math.Round((RepliedAt.Value - CreatedAt).TotalHours);
            }
            return null;
        }
    }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SupplierReplyQueryDTO
{
    public string? Keyword { get; set; }
    public int? SupplierId { get; set; }
    public SupplierReplyStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class SupplierReplyCreateDTO
{
    public int ReplenishmentSuggestionId { get; set; }
    public int SupplierId { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public decimal QuotedQuantity { get; set; }
    public decimal QuotedUnitPrice { get; set; }
    public DateTime? PromisedDeliveryDate { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ProductionDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? SupplierNotes { get; set; }
    public DateTime ReplyDueDate { get; set; }
    public int? RepliedByUserId { get; set; }
}
