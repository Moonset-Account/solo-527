using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DowntimeController : ControllerBase
{
    private readonly IDowntimeService _downtimeService;

    public DowntimeController(IDowntimeService downtimeService)
    {
        _downtimeService = downtimeService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DowntimeRecordDto>> GetById(Guid id)
    {
        var record = await _downtimeService.GetByIdAsync(id);
        if (record == null)
            return NotFound();
        return Ok(record);
    }

    [HttpGet("equipment/{equipmentId}")]
    public async Task<ActionResult<IEnumerable<DowntimeRecordDto>>> GetByEquipment(
        Guid equipmentId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var records = await _downtimeService.GetByEquipmentAsync(equipmentId, startDate, endDate);
        return Ok(records);
    }

    [HttpPost("start")]
    public async Task<ActionResult<DowntimeRecordDto>> StartDowntime([FromBody] CreateDowntimeRecordDto dto)
    {
        try
        {
            var record = await _downtimeService.StartDowntimeAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = record.Id }, record);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/end")]
    public async Task<ActionResult<DowntimeRecordDto>> EndDowntime(Guid id)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            return Unauthorized();

        try
        {
            var record = await _downtimeService.EndDowntimeAsync(id, Guid.Parse(userIdClaim));
            return Ok(record);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
