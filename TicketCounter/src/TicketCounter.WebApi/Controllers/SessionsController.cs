
using Microsoft.AspNetCore.Mvc;
using TicketCounter.Application.DTOs;
using TicketCounter.Application.Services;
using TicketCounter.Domain.Enums;

namespace TicketCounter.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _service;
    private const string OperatorHeader = "X-Operator";

    public SessionsController(ISessionService service)
    {
        _service = service;
    }

    private string GetOperator() => Request.Headers[OperatorHeader].FirstOrDefault() ?? "admin";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SessionDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SessionDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SessionDto>> Create([FromBody] CreateSessionDto dto)
    {
        var result = await _service.CreateAsync(dto, GetOperator());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSessionDto dto)
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

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] SessionStatus status)
    {
        try
        {
            await _service.ChangeStatusAsync(id, status, GetOperator());
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }
}
