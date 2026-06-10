using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CarWash.WebAPI.Hubs;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public AppointmentsController(IHubContext<NotificationHub> hubContext)
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
                    customerId = Guid.NewGuid().ToString(),
                    servicePackageId = Guid.NewGuid().ToString(),
                    appointmentTime = DateTime.Now.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    status = status ?? "confirmed",
                    technicianId = Guid.NewGuid().ToString(),
                    workstationId = Guid.NewGuid().ToString(),
                    notes = "请提前到店",
                    createdAt = DateTime.Now.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = DateTime.Now.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
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
            customerId = Guid.NewGuid().ToString(),
            servicePackageId = Guid.NewGuid().ToString(),
            appointmentTime = DateTime.Now.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            status = "confirmed",
            technicianId = Guid.NewGuid().ToString(),
            workstationId = Guid.NewGuid().ToString(),
            notes = "请提前到店",
            createdAt = DateTime.Now.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            updatedAt = DateTime.Now.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request)
    {
        var appointmentId = Guid.NewGuid().ToString();

        var appointment = new
        {
            id = appointmentId,
            customerId = request.CustomerId,
            servicePackageId = request.ServicePackageId,
            appointmentTime = request.AppointmentTime,
            status = "pending",
            notes = request.Notes,
            createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        var response = new
        {
            appointment,
            paymentUrl = $"/booking/pay?appointmentId={appointmentId}"
        };

        await _hubContext.Clients.Group("Dashboard").SendAsync("NewAppointment", appointment);

        return CreatedAtAction(nameof(GetById), new { id = appointmentId }, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAppointmentRequest request)
    {
        var updated = new
        {
            id,
            customerId = request.CustomerId,
            servicePackageId = request.ServicePackageId,
            appointmentTime = request.AppointmentTime,
            status = request.Status,
            technicianId = request.TechnicianId,
            workstationId = request.WorkstationId,
            notes = request.Notes,
            updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        await _hubContext.Clients.All.SendAsync("AppointmentUpdated", new
        {
            AppointmentId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(updated);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        await _hubContext.Clients.All.SendAsync("AppointmentUpdated", new
        {
            AppointmentId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { id, status = request.Status, updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _hubContext.Clients.All.SendAsync("AppointmentCancelled", new
        {
            AppointmentId = id,
            Timestamp = DateTime.UtcNow
        });

        return NoContent();
    }
}

public class CreateAppointmentRequest
{
    public string CustomerId { get; set; } = string.Empty;
    public string ServicePackageId { get; set; } = string.Empty;
    public string AppointmentTime { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public string CustomerId { get; set; } = string.Empty;
    public string ServicePackageId { get; set; } = string.Empty;
    public string AppointmentTime { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TechnicianId { get; set; }
    public string? WorkstationId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
