
using PrintingFactory.Domain.Entities;

namespace PrintingFactory.Application.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string MaterialRequirements { get; set; } = string.Empty;
    public string SpecialRequirements { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime DeliveryDate { get; set; }
    public OrderStatus Status { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateOrderDto
{
    public int StoreId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string MaterialRequirements { get; set; } = string.Empty;
    public string SpecialRequirements { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime DeliveryDate { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateOrderDto
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Specifications { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string MaterialRequirements { get; set; } = string.Empty;
    public string SpecialRequirements { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public OrderStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class OrderDetailDto : OrderDto
{
    public ICollection<ProductionProgressDto> ProductionProgresses { get; set; } = new List<ProductionProgressDto>();
    public ICollection<QualityInspectionDto> QualityInspections { get; set; } = new List<QualityInspectionDto>();
    public ICollection<DeliveryTrackingDto> DeliveryTrackings { get; set; } = new List<DeliveryTrackingDto>();
    public ICollection<EquipmentAssignmentDto> EquipmentAssignments { get; set; } = new List<EquipmentAssignmentDto>();
}

public class StoreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class ProductionNodeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class ProductionProgressDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductionNodeId { get; set; }
    public string ProductionNodeName { get; set; } = string.Empty;
    public ProductionStatus Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
    public int? EquipmentId { get; set; }
    public string? EquipmentName { get; set; }
}

public class UpdateProductionProgressDto
{
    public int Id { get; set; }
    public ProductionStatus Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
    public int? EquipmentId { get; set; }
}

public class EquipmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; }
    public string? Location { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Remarks { get; set; }
    public bool IsActive { get; set; }
}

public class EquipmentAssignmentDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int EquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public int? ProductionNodeId { get; set; }
    public string? ProductionNodeName { get; set; }
    public DateTime AssignTime { get; set; }
    public DateTime? ReleaseTime { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
}

public class QualityInspectionDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string Inspector { get; set; } = string.Empty;
    public DateTime InspectionDate { get; set; }
    public InspectionResult Result { get; set; }
    public int InspectedQuantity { get; set; }
    public int PassedQuantity { get; set; }
    public int FailedQuantity { get; set; }
    public string? CheckItems { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public QualityIssueDto? QualityIssue { get; set; }
}

public class CreateQualityInspectionDto
{
    public int OrderId { get; set; }
    public string Inspector { get; set; } = string.Empty;
    public DateTime InspectionDate { get; set; }
    public InspectionResult Result { get; set; }
    public int InspectedQuantity { get; set; }
    public int PassedQuantity { get; set; }
    public int FailedQuantity { get; set; }
    public string? CheckItems { get; set; }
    public string? Remarks { get; set; }
}

public class QualityIssueDto
{
    public int Id { get; set; }
    public int QualityInspectionId { get; set; }
    public string AffectedScope { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string HandlingPath { get; set; } = string.Empty;
    public string CorrectiveAction { get; set; } = string.Empty;
    public string PreventiveAction { get; set; } = string.Empty;
    public string ReviewNotes { get; set; } = string.Empty;
    public QualityIssueStatus Status { get; set; }
    public string Handler { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateQualityIssueDto
{
    public int QualityInspectionId { get; set; }
    public string AffectedScope { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string HandlingPath { get; set; } = string.Empty;
    public string CorrectiveAction { get; set; } = string.Empty;
    public string PreventiveAction { get; set; } = string.Empty;
    public string ReviewNotes { get; set; } = string.Empty;
    public QualityIssueStatus Status { get; set; }
    public string Handler { get; set; } = string.Empty;
    public string Reviewer { get; set; } = string.Empty;
}

public class DeliveryTrackingDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public DeliveryStatus Status { get; set; }
    public DateTime? ScheduledDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? DeliveryMethod { get; set; }
    public string? TrackingNo { get; set; }
    public string? Receiver { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Signature { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateDeliveryTrackingDto
{
    public int Id { get; set; }
    public DeliveryStatus Status { get; set; }
    public DateTime? ScheduledDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? DeliveryMethod { get; set; }
    public string? TrackingNo { get; set; }
    public string? Receiver { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Signature { get; set; }
    public string? Remarks { get; set; }
}

public class StoreSummaryDto
{
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int InProductionOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int QualityFailedOrders { get; set; }
    public decimal TotalAmount { get; set; }
    public int OverdueOrders { get; set; }
}

public class BatchOperationDto
{
    public int Id { get; set; }
    public string OperationName { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public BatchOperationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Remarks { get; set; }
    public ICollection<BatchOperationItemDto> Items { get; set; } = new List<BatchOperationItemDto>();
}

public class BatchOperationItemDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public BatchItemStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public bool CanRetry { get; set; }
    public int RetryCount { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class BatchProcessRequest
{
    public string OperationName { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public List<int> OrderIds { get; set; } = new();
    public BatchOperationType OperationType { get; set; }
    public string? Remarks { get; set; }
}

public enum BatchOperationType
{
    StartProduction,
    CompleteProduction,
    MarkAsDelivered,
    UpdateDeliveryDate,
    ExportOrders
}

public class BatchProcessResult
{
    public int BatchOperationId { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<BatchOperationItemDto> FailedItems { get; set; } = new();
}

public class DeliveryReminderDto
{
    public int OrderId { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime DeliveryDate { get; set; }
    public OrderStatus Status { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsOverdue { get; set; }
    public string ReminderLevel { get; set; } = string.Empty;
}
