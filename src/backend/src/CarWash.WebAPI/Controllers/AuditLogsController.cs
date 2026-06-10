using Microsoft.AspNetCore.Mvc;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? entityType = null,
        [FromQuery] string? entityId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? operatorId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    entityType = "appointment",
                    entityId = Guid.NewGuid().ToString(),
                    action = "status_changed",
                    oldValue = "pending",
                    newValue = "confirmed",
                    operatorId = Guid.NewGuid().ToString(),
                    operatorName = "值班员小张",
                    timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "确认预约"
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    entityType = "payment",
                    entityId = Guid.NewGuid().ToString(),
                    action = "payment_completed",
                    oldValue = "pending",
                    newValue = "paid",
                    operatorId = Guid.NewGuid().ToString(),
                    operatorName = "系统",
                    timestamp = DateTime.Now.AddHours(-3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "微信支付成功"
                }
            },
            total = 2,
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
            entityType = "appointment",
            entityId = Guid.NewGuid().ToString(),
            action = "status_changed",
            oldValue = "pending",
            newValue = "confirmed",
            operatorId = Guid.NewGuid().ToString(),
            operatorName = "值班员小张",
            timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
            notes = "确认预约"
        };

        return Ok(result);
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, string entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    entityType,
                    entityId,
                    action = "created",
                    oldValue = (string?)null,
                    newValue = "{...}",
                    operatorId = Guid.NewGuid().ToString(),
                    operatorName = "顾客",
                    timestamp = DateTime.Now.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "创建预约"
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    entityType,
                    entityId,
                    action = "status_changed",
                    oldValue = "pending",
                    newValue = "confirmed",
                    operatorId = Guid.NewGuid().ToString(),
                    operatorName = "值班员小张",
                    timestamp = DateTime.Now.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "确认预约"
                }
            },
            total = 2,
            page,
            pageSize
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditLogRequest request)
    {
        var logId = Guid.NewGuid().ToString();

        var log = new
        {
            id = logId,
            entityType = request.EntityType,
            entityId = request.EntityId,
            action = request.Action,
            oldValue = request.OldValue,
            newValue = request.NewValue,
            operatorId = request.OperatorId,
            operatorName = request.OperatorName,
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            notes = request.Notes
        };

        return CreatedAtAction(nameof(GetById), new { id = logId }, log);
    }

    [HttpGet("entity-types")]
    public async Task<IActionResult> GetEntityTypes()
    {
        var result = new[]
        {
            new { value = "appointment", label = "预约" },
            new { value = "payment", label = "支付" },
            new { value = "technician", label = "技师" },
            new { value = "workstation", label = "工位" },
            new { value = "parts_shortage", label = "配件缺货" },
            new { value = "cashier_order", label = "收银单" }
        };

        return Ok(result);
    }

    [HttpGet("actions")]
    public async Task<IActionResult> GetActions([FromQuery] string? entityType = null)
    {
        var result = new[]
        {
            new { value = "created", label = "创建" },
            new { value = "updated", label = "更新" },
            new { value = "status_changed", label = "状态变更" },
            new { value = "deleted", label = "删除" },
            new { value = "payment_completed", label = "支付完成" },
            new { value = "refunded", label = "退款" }
        };

        return Ok(result);
    }
}

public class CreateAuditLogRequest
{
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string OperatorId { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
