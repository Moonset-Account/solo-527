namespace CarWash.Application.DTOs;

public class CashierOrderDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public List<CashierOrderItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CashierOrderItemDto
{
    public Guid Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public List<string> PartsUsed { get; set; } = new();
}

public class CreateCashierOrderRequest
{
    public Guid AppointmentId { get; set; }
    public List<CreateCashierOrderItemRequest> Items { get; set; } = new();
    public decimal Discount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class CreateCashierOrderItemRequest
{
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public List<string> PartsUsed { get; set; } = new();
}

public class UpdateCashierOrderStatusRequest
{
    public string PaymentStatus { get; set; } = string.Empty;
}
