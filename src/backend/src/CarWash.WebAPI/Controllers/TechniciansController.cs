using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CarWash.WebAPI.Hubs;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TechniciansController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public TechniciansController(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var result = new[]
        {
            new
            {
                id = Guid.NewGuid().ToString(),
                name = "张师傅",
                specialties = new[] { "洗车", "美容" },
                status = status ?? "available",
                currentWorkstationId = (string?)null,
                capacityDay = 8,
                capacityUsed = 3
            },
            new
            {
                id = Guid.NewGuid().ToString(),
                name = "李师傅",
                specialties = new[] { "维修", "保养" },
                status = "busy",
                currentWorkstationId = Guid.NewGuid().ToString(),
                capacityDay = 8,
                capacityUsed = 5
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
            name = "张师傅",
            specialties = new[] { "洗车", "美容" },
            status = "available",
            currentWorkstationId = (string?)null,
            capacityDay = 8,
            capacityUsed = 3
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTechnicianRequest request)
    {
        var technicianId = Guid.NewGuid().ToString();

        var technician = new
        {
            id = technicianId,
            name = request.Name,
            specialties = request.Specialties,
            status = "available",
            capacityDay = request.CapacityDay,
            capacityUsed = 0
        };

        return CreatedAtAction(nameof(GetById), new { id = technicianId }, technician);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateTechnicianRequest request)
    {
        var updated = new
        {
            id,
            name = request.Name,
            specialties = request.Specialties,
            status = request.Status,
            capacityDay = request.CapacityDay
        };

        await _hubContext.Clients.All.SendAsync("TechnicianStatusUpdated", new
        {
            TechnicianId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(updated);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateTechnicianStatusRequest request)
    {
        await _hubContext.Clients.All.SendAsync("TechnicianStatusUpdated", new
        {
            TechnicianId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(new { id, status = request.Status, updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        return NoContent();
    }

    [HttpGet("{id}/schedule")]
    public async Task<IActionResult> GetSchedule(string id, [FromQuery] DateTime date)
    {
        var result = new
        {
            technicianId = id,
            date = date.ToString("yyyy-MM-dd"),
            appointments = new[]
            {
                new { id = Guid.NewGuid().ToString(), time = "09:00", customerName = "王先生", service = "精洗套餐" },
                new { id = Guid.NewGuid().ToString(), time = "11:00", customerName = "李女士", service = "内饰清洁" }
            },
            capacityDay = 8,
            capacityUsed = 2
        };

        return Ok(result);
    }
}

public class CreateTechnicianRequest
{
    public string Name { get; set; } = string.Empty;
    public string[] Specialties { get; set; } = Array.Empty<string>();
    public int CapacityDay { get; set; } = 8;
}

public class UpdateTechnicianRequest
{
    public string Name { get; set; } = string.Empty;
    public string[] Specialties { get; set; } = Array.Empty<string>();
    public string Status { get; set; } = string.Empty;
    public int CapacityDay { get; set; }
}

public class UpdateTechnicianStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
