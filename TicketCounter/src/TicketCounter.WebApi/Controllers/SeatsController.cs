
using Microsoft.AspNetCore.Mvc;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Services;
using TicketCounter.Domain.Enums;

namespace TicketCounter.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeatsController : ControllerBase
{
    private readonly ISeatService _service;
    private const string OperatorHeader = "X-Operator";

    public SeatsController(ISeatService service)
    {
        _service = service;
    }

    private string GetOperator() => Request.Headers[OperatorHeader].FirstOrDefault() ?? "admin";

    [HttpGet("bysession/{sessionId}")]
    public async Task<ActionResult<IEnumerable<SeatDto>>> GetBySession(Guid sessionId)
    {
        var result = await _service.GetBySessionAsync(sessionId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SeatDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SeatDto>> Create([FromBody] CreateSeatDto dto)
    {
        var result = await _service.CreateAsync(dto, GetOperator());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("batch")]
    public async Task<ActionResult<IEnumerable<SeatDto>>> BatchCreate([FromBody] BatchCreateSeatsDto dto)
    {
        var result = await _service.BatchCreateAsync(dto, GetOperator());
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSeatDto dto)
    {
        try
        {
            await _service.UpdateAsync(id, dto, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _service.DeleteAsync(id, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPost("batch/status")]
    public async Task<IActionResult> BatchUpdateStatus([FromBody] BatchStatusUpdateDto dto)
    {
        await _service.BatchUpdateStatusAsync(dto.SessionId, dto.FromStatus, dto.ToStatus, dto.Area, GetOperator());
        return NoContent();
    }
}

public class BatchStatusUpdateDto
{
    public Guid SessionId { get; set; }
    public SeatStatus FromStatus { get; set; }
    public SeatStatus ToStatus { get; set; }
    public string? Area { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class TicketStockController : ControllerBase
{
    private readonly ITicketStockService _service;
    private const string OperatorHeader = "X-Operator";

    public TicketStockController(ITicketStockService service)
    {
        _service = service;
    }

    private string GetOperator() => Request.Headers[OperatorHeader].FirstOrDefault() ?? "admin";

    [HttpGet("bysession/{sessionId}")]
    public async Task<ActionResult<IEnumerable<TicketStockDto>>> GetBySession(Guid sessionId)
    {
        var result = await _service.GetBySessionAsync(sessionId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketStockDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TicketStockDto>> Create([FromBody] CreateTicketStockDto dto)
    {
        var result = await _service.CreateAsync(dto, GetOperator());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTicketStockDto dto)
    {
        try
        {
            await _service.UpdateAsync(id, dto, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _service.DeleteAsync(id, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshInventory([FromBody] RefreshInventoryDto? dto)
    {
        await _service.RefreshInventoryOccupancyAsync(dto?.SessionId);
        return NoContent();
    }
}

public class RefreshInventoryDto
{
    public Guid? SessionId { get; set; }
}
