using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class OrderFulfillment : EntityBase
{
    public Guid OrderId { get; set; }
    public string FulfillmentNo { get; set; } = string.Empty;
    public FulfillmentStatus Status { get; set; } = FulfillmentStatus.Pending;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Amount { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? Handler { get; set; }
    public string? Remarks { get; set; }
    public string? ExceptionReason { get; set; }

    public Order Order { get; set; } = null!;
}
