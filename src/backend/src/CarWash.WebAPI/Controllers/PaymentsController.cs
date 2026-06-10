using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CarWash.WebAPI.Hubs;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public PaymentsController(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    appointmentId = Guid.NewGuid().ToString(),
                    amount = 99.99m,
                    method = "wechat",
                    status = status ?? "paid",
                    paidAt = DateTime.Now.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
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
            amount = 99.99m,
            method = "wechat",
            status = "paid",
            paidAt = DateTime.Now.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
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
            amount = 99.99m,
            method = "wechat",
            status = "paid",
            paidAt = DateTime.Now.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            createdAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var paymentId = Guid.NewGuid().ToString();

        var payment = new
        {
            id = paymentId,
            appointmentId = request.AppointmentId,
            amount = request.Amount,
            method = request.Method,
            status = "pending",
            createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return CreatedAtAction(nameof(GetById), new { id = paymentId }, payment);
    }

    [HttpPut("{id}/pay")]
    public async Task<IActionResult> Pay(string id, [FromBody] PayRequest request)
    {
        var updated = new
        {
            id,
            status = "paid",
            paidAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            method = request.Method
        };

        await _hubContext.Clients.All.SendAsync("PaymentCompleted", new
        {
            PaymentId = id,
            AppointmentId = request.AppointmentId,
            Timestamp = DateTime.UtcNow
        });

        return Ok(updated);
    }

    [HttpPut("{id}/refund")]
    public async Task<IActionResult> Refund(string id)
    {
        var updated = new
        {
            id,
            status = "refunded",
            refundedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(updated);
    }
}

public class CreatePaymentRequest
{
    public string AppointmentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
}

public class PayRequest
{
    public string AppointmentId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
}
