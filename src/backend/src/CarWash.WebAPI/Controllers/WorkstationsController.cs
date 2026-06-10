using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CarWash.WebAPI.Hubs;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkstationsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public WorkstationsController(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null, [FromQuery] string? type = null)
    {
        var result = new[]
        {
            new
            {
                id = Guid.NewGuid().ToString(),
                name = "1号工位",
                type = "wash",
                status = status ?? "idle",
                currentAppointmentId = (string?)null,
                currentTechnicianId = (string?)null
            },
            new
            {
                id = Guid.NewGuid().ToString(),
                name = "2号工位",
                type = "detail",
                status = "occupied",
                currentAppointmentId = Guid.NewGuid().ToString(),
                currentTechnicianId = Guid.NewGuid().ToString()
            },
            new
            {
                id = Guid.NewGuid().ToString(),
                name = "3号工位",
                type = "repair",
                status = "maintenance",
                currentAppointmentId = (string?)null,
                currentTechnicianId = (string?)null
            }
        };

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var result = new
        {
            id,
            name = "1号工位",
            type = "wash",
            status = "idle",
            currentAppointmentId = (string?)null,
            currentTechnicianId = (string?)null
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkstationRequest request)
    {
        var workstationId = Guid.NewGuid().ToString();

        var workstation = new
        {
            id = workstationId,
            name = request.Name,
            type = request.Type,
            status = "idle"
        };

        return CreatedAtAction(nameof(GetById), new { id = workstationId }, workstation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateWorkstationRequest request)
    {
        var updated = new
        {
            id,
            name = request.Name,
            type = request.Type,
            status = request.Status
        };

        await _hubContext.Clients.All.SendAsync("WorkstationStatusUpdated", new
        {
            WorkstationId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(updated);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateWorkstationStatusRequest request)
    {
        await _hubContext.Clients.All.SendAsync("WorkstationStatusUpdated", new
        {
            WorkstationId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { id, status = request.Status, updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") });
    }

    [HttpPut("{id}/assign")]
    public async Task<IActionResult> AssignAppointment(string id, [FromBody] AssignWorkstationRequest request)
    {
        await _hubContext.Clients.All.SendAsync("WorkstationStatusUpdated", new
        {
            WorkstationId = id,
            Status = "occupied",
            AppointmentId = request.AppointmentId,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new
        {
            id,
            status = "occupied",
            currentAppointmentId = request.AppointmentId,
            currentTechnicianId = request.TechnicianId,
            updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });
    }

    [HttpPut("{id}/release")]
    public async Task<IActionResult> Release(string id)
    {
        await _hubContext.Clients.All.SendAsync("WorkstationStatusUpdated", new
        {
            WorkstationId = id,
            Status = "idle",
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { id, status = "idle", updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        return NoContent();
    }
}

public class CreateWorkstationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class UpdateWorkstationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class UpdateWorkstationStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class AssignWorkstationRequest
{
    public string AppointmentId { get; set; } = string.Empty;
    public string TechnicianId { get; set; } = string.Empty;
}
