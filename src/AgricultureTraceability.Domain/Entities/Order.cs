using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public OrderStatus Status { get; set; }
    public Guid HarvestBatchId { get; set; }
    public HarvestBatch? HarvestBatch { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}
