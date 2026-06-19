using CoworkingBooking.Domain.Enums;

namespace CoworkingBooking.Domain.Entities;

public class Order : EntityBase
{
    public string OrderNo { get; set; } = string.Empty;
    public Guid? ContractId { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public PaymentMethod? PaymentMethod { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentRefNo { get; set; }
    public string? Remarks { get; set; }
    public Guid? RelatedAppointmentId { get; set; }

    public LeaseContract? Contract { get; set; }
    public ICollection<OrderFulfillment> Fulfillments { get; set; } = new List<OrderFulfillment>();
}
