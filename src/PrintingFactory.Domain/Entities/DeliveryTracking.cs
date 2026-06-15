
namespace PrintingFactory.Domain.Entities;

public class DeliveryTracking
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;
    public DateTime? ScheduledDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public string? DeliveryMethod { get; set; }
    public string? TrackingNo { get; set; }
    public string? Receiver { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Signature { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum DeliveryStatus
{
    Pending,
    Scheduled,
    InTransit,
    Delivered,
    Returned,
    Failed
}
