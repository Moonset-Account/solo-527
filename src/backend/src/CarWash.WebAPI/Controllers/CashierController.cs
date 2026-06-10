using Microsoft.AspNetCore.Mvc;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CashierController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    appointmentId = Guid.NewGuid().ToString(),
                    customerId = Guid.NewGuid().ToString(),
                    items = new[]
                    {
                        new { serviceName = "精洗套餐", quantity = 1, unitPrice = 99.99m, partsUsed = new[] { "洗车液", "毛巾" } }
                    },
                    subtotal = 99.99m,
                    discount = 0m,
                    total = 99.99m,
                    paymentMethod = "wechat",
                    paymentStatus = status ?? "paid",
                    createdAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
            },
            total = 1,
            page,
            pageSize
        };

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var result = new
        {
            id,
            appointmentId = Guid.NewGuid().ToString(),
            customerId = Guid.NewGuid().ToString(),
            items = new[]
            {
                new { id = Guid.NewGuid().ToString(), serviceName = "精洗套餐", quantity = 1, unitPrice = 99.99m, partsUsed = new[] { "洗车液", "毛巾" } }
            },
            subtotal = 99.99m,
            discount = 0m,
            total = 99.99m,
            paymentMethod = "wechat",
            paymentStatus = "paid",
            createdAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpGet("appointment/{appointmentId}")]
    public async Task<IActionResult> GetByAppointmentId(string appointmentId)
    {
        var result = new
        {
            id = Guid.NewGuid().ToString(),
            appointmentId,
            customerId = Guid.NewGuid().ToString(),
            items = new[]
            {
                new { id = Guid.NewGuid().ToString(), serviceName = "精洗套餐", quantity = 1, unitPrice = 99.99m, partsUsed = new[] { "洗车液", "毛巾" } }
            },
            subtotal = 99.99m,
            discount = 0m,
            total = 99.99m,
            paymentMethod = "wechat",
            paymentStatus = "paid",
            createdAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCashierOrderRequest request)
    {
        var orderId = Guid.NewGuid().ToString();

        var order = new
        {
            id = orderId,
            appointmentId = request.AppointmentId,
            customerId = request.CustomerId,
            items = request.Items,
            subtotal = request.Subtotal,
            discount = request.Discount,
            total = request.Total,
            paymentMethod = request.PaymentMethod,
            paymentStatus = "pending",
            createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return CreatedAtAction(nameof(GetById), new { id = orderId }, order);
    }

    [HttpPut("{id}/pay")]
    public async Task<IActionResult> Pay(string id, [FromBody] PayCashierOrderRequest request)
    {
        var updated = new
        {
            id,
            paymentStatus = "paid",
            paymentMethod = request.PaymentMethod,
            paidAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(updated);
    }

    [HttpPut("{id}/refund")]
    public async Task<IActionResult> Refund(string id, [FromBody] RefundRequest request)
    {
        var updated = new
        {
            id,
            paymentStatus = "refunded",
            refundedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            refundReason = request.Reason
        };

        return Ok(updated);
    }
}

public class CreateCashierOrderRequest
{
    public string AppointmentId { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public List<CashierOrderItemRequest> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class CashierOrderItemRequest
{
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string[]? PartsUsed { get; set; }
}

public class PayCashierOrderRequest
{
    public string PaymentMethod { get; set; } = string.Empty;
}

public class RefundRequest
{
    public string Reason { get; set; } = string.Empty;
}
