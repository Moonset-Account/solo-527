using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CarWash.WebAPI.Hubs;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartsShortageController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public PartsShortageController(IHubContext<NotificationHub> hubContext)
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
                    partName = "进口蜡水",
                    affectedServices = new[] { "精洗套餐", "打蜡服务" },
                    affectedWorkstationIds = new[] { Guid.NewGuid().ToString() },
                    status = status ?? "reported",
                    estimatedArrival = DateTime.Now.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    reportedAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    resolvedAt = (string?)null,
                    nodes = new[]
                    {
                        new { status = "reported", operatorId = Guid.NewGuid().ToString(), operatorName = "张师傅", timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"), notes = "发现库存不足" }
                    }
                }
            },
            total = 1,
            page,
            pageSize
        };

        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var result = new[]
        {
            new
            {
                id = Guid.NewGuid().ToString(),
                partName = "进口蜡水",
                affectedServices = new[] { "精洗套餐", "打蜡服务" },
                affectedWorkstationIds = new[] { Guid.NewGuid().ToString() },
                status = "reported",
                estimatedArrival = DateTime.Now.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                reportedAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
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
            partName = "进口蜡水",
            affectedServices = new[] { "精洗套餐", "打蜡服务" },
            affectedWorkstationIds = new[] { Guid.NewGuid().ToString() },
            status = "reported",
            estimatedArrival = DateTime.Now.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            reportedAt = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            resolvedAt = (string?)null,
            nodes = new[]
            {
                new { id = Guid.NewGuid().ToString(), status = "reported", operatorId = Guid.NewGuid().ToString(), operatorName = "张师傅", timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"), notes = "发现库存不足" }
            }
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartsShortageRequest request)
    {
        var shortageId = Guid.NewGuid().ToString();
        var operatorId = Guid.NewGuid().ToString();
        var operatorName = "当前用户";

        var shortage = new
        {
            id = shortageId,
            partName = request.PartName,
            affectedServices = request.AffectedServices,
            affectedWorkstationIds = request.AffectedWorkstationIds,
            status = "reported",
            estimatedArrival = request.EstimatedArrival,
            reportedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            nodes = new[]
            {
                new { status = "reported", operatorId, operatorName, timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"), notes = request.Notes }
            }
        };

        await _hubContext.Clients.All.SendAsync("PartsShortageUpdated", new
        {
            PartsShortageId = shortageId,
            Status = "reported",
            Timestamp = DateTime.UtcNow
        });

        return CreatedAtAction(nameof(GetById), new { id = shortageId }, shortage);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdatePartsShortageStatusRequest request)
    {
        var operatorId = Guid.NewGuid().ToString();
        var operatorName = "当前用户";

        var node = new
        {
            status = request.Status,
            operatorId,
            operatorName,
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            notes = request.Notes
        };

        var result = new
        {
            id,
            status = request.Status,
            updatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            latestNode = node
        };

        await _hubContext.Clients.All.SendAsync("PartsShortageUpdated", new
        {
            PartsShortageId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(result);
    }

    [HttpPost("{id}/nodes")]
    public async Task<IActionResult> AddNode(string id, [FromBody] AddPartsShortageNodeRequest request)
    {
        var nodeId = Guid.NewGuid().ToString();
        var operatorId = Guid.NewGuid().ToString();

        var node = new
        {
            id = nodeId,
            status = request.Status,
            operatorId,
            operatorName = request.OperatorName,
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            notes = request.Notes
        };

        await _hubContext.Clients.All.SendAsync("PartsShortageUpdated", new
        {
            PartsShortageId = id,
            Status = request.Status,
            Timestamp = DateTime.UtcNow
        });

        return Ok(node);
    }

    [HttpPut("{id}/resolve")]
    public async Task<IActionResult> Resolve(string id)
    {
        var result = new
        {
            id,
            status = "restocked",
            resolvedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        await _hubContext.Clients.All.SendAsync("PartsShortageUpdated", new
        {
            PartsShortageId = id,
            Status = "restocked",
            Timestamp = DateTime.UtcNow
        });

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        return NoContent();
    }
}

public class CreatePartsShortageRequest
{
    public string PartName { get; set; } = string.Empty;
    public string[] AffectedServices { get; set; } = Array.Empty<string>();
    public string[] AffectedWorkstationIds { get; set; } = Array.Empty<string>();
    public string? EstimatedArrival { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePartsShortageStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class AddPartsShortageNodeRequest
{
    public string Status { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
