using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Application.DTOs.Order;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public Guid? ContractId { get; set; }
    public string? ContractNo { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public OrderStatus Status { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public PaymentMethod? PaymentMethod { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Remarks { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<FulfillmentDto> Fulfillments { get; set; } = new();
}

public class FulfillmentDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string FulfillmentNo { get; set; } = string.Empty;
    public FulfillmentStatus Status { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Amount { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
    public string? ExceptionReason { get; set; }
}

public class CreateOrderRequest
{
    public Guid? ContractId { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
    public List<CreateFulfillmentRequest> Fulfillments { get; set; } = new();
}

public class CreateFulfillmentRequest
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
}

public class PayOrderRequest
{
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentRefNo { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateFulfillmentRequest
{
    public FulfillmentStatus Status { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
    public string? ExceptionReason { get; set; }
}

public class OrderQuery : Common.PagedQuery
{
    public OrderStatus? Status { get; set; }
    public Guid? ContractId { get; set; }
    public string? CustomerName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class OperationLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? TargetName { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime OperatedAt { get; set; }
}

public class OperationLogQuery : Common.PagedQuery
{
    public Guid? UserId { get; set; }
    public string? Module { get; set; }
    public string? Operation { get; set; }
    public bool? IsSuccess { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
