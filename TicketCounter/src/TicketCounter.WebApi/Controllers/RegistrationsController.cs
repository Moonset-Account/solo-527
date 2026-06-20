
using Microsoft.AspNetCore.Mvc;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Services;

namespace TicketCounter.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private readonly IRegistrationService _service;
    private const string OperatorHeader = "X-Operator";

    public RegistrationsController(IRegistrationService service)
    {
        _service = service;
    }

    private string GetOperator() => Request.Headers[OperatorHeader].FirstOrDefault() ?? "admin";

    [HttpPost("query")]
    public async Task<ActionResult<PagedResult<RegistrationDto>>> Query([FromBody] RegistrationQueryDto query)
    {
        var result = await _service.QueryAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RegistrationDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("submit")]
    public async Task<ActionResult<RegistrationDto>> Submit([FromBody] CreateRegistrationDto dto)
    {
        var result = await _service.SubmitAsync(dto, null);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationDto>> Create([FromBody] CreateRegistrationDto dto)
    {
        var result = await _service.SubmitAsync(dto, GetOperator());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewRegistrationDto dto)
    {
        try
        {
            await _service.ReviewAsync(id, dto, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelRegistrationDto dto)
    {
        try
        {
            await _service.CancelAsync(id, GetOperator(), dto.Comment);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpGet("{id}/audit")]
    public async Task<ActionResult<IEnumerable<RegistrationAuditDto>>> GetAudit(Guid id)
    {
        var result = await _service.GetAuditTrailAsync(id);
        return Ok(result);
    }
}

public class CancelRegistrationDto
{
    public string Comment { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class TodosController : ControllerBase
{
    private readonly ITodoService _service;
    private const string OperatorHeader = "X-Operator";

    public TodosController(ITodoService service)
    {
        _service = service;
    }

    private string GetOperator() => Request.Headers[OperatorHeader].FirstOrDefault() ?? "admin";

    [HttpGet]
    public async Task<ActionResult<PagedResult<TodoItemDto>>> Query([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] int? status = null, [FromQuery] int? priority = null, [FromQuery] string? keyword = null)
    {
        var result = await _service.QueryAsync(page, pageSize,
            status.HasValue ? (Domain.Enums.TodoStatus)status.Value : null,
            priority.HasValue ? (Domain.Enums.TodoPriority)priority.Value : null, keyword);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoItemDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TodoItemDto>> Create([FromBody] CreateTodoItemDto dto)
    {
        var result = await _service.CreateAsync(dto, GetOperator());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveTodoItemDto dto)
    {
        try
        {
            await _service.ResolveAsync(id, dto, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpGet("pending/count")]
    public async Task<ActionResult<int>> GetPendingCount()
    {
        var count = await _service.GetPendingCountAsync();
        return Ok(count);
    }
}

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly IOperationLogService _service;

    public LogsController(IOperationLogService service)
    {
        _service = service;
    }

    [HttpPost("query")]
    public async Task<ActionResult<PagedResult<OperationLogDto>>> Query([FromBody] OperationLogQueryDto query)
    {
        var result = await _service.QueryAsync(query);
        return Ok(result);
    }

    [HttpGet("entity")]
    public async Task<ActionResult<IEnumerable<OperationLogDto>>> GetByEntity([FromQuery] string entityType, [FromQuery] string entityId)
    {
        var result = await _service.GetByEntityAsync(entityType, entityId);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
public class ApiRetryController : ControllerBase
{
    private readonly IApiRetryService _service;

    public ApiRetryController(IApiRetryService service)
    {
        _service = service;
    }

    [HttpPost("query")]
    public async Task<ActionResult<PagedResult<ApiRetryRecordDto>>> Query([FromBody] ApiRetryQueryDto query)
    {
        var result = await _service.QueryAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiRetryRecordDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id}/retry")]
    public async Task<IActionResult> Retry(Guid id)
    {
        try
        {
            await _service.RetryAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<ApiRetryRecordDto>>> GetPending()
    {
        var result = await _service.GetPendingRetriesAsync();
        return Ok(result);
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export([FromBody] ApiRetryQueryDto query)
    {
        var bytes = await _service.ExportAsync(query);
        var fileName = $"ApiRetryRecords_{DateTime.Now:yyyyMMddHHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var result = await _service.GetDashboardStatsAsync();
        return Ok(result);
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<IEnumerable<InventoryOccupancyDto>>> GetInventory([FromQuery] Guid? sessionId = null)
    {
        var result = await _service.GetInventoryOccupancyAsync(sessionId);
        return Ok(result);
    }
}
