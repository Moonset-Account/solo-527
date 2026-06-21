using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAll()
    {
        var equipments = await _equipmentService.GetAllAsync();
        return Ok(equipments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EquipmentDto>> GetById(Guid id)
    {
        var equipment = await _equipmentService.GetByIdAsync(id);
        if (equipment == null)
            return NotFound();
        return Ok(equipment);
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetByStatus(int status)
    {
        var equipments = await _equipmentService.GetByStatusAsync((EquipmentStatus)status);
        return Ok(equipments);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<EquipmentDto>> Create([FromBody] CreateEquipmentDto dto)
    {
        var equipment = await _equipmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
    }

    [HttpPut("{id}/status")]
    [Authorize(Policy = "WorkshopDirectorOrAdmin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            return Unauthorized();

        await _equipmentService.UpdateStatusAsync(id, (EquipmentStatus)dto.Status, Guid.Parse(userIdClaim), dto.Reason);
        return NoContent();
    }

    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<EquipmentStatisticsDto>> GetStatistics(Guid id, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var stats = await _equipmentService.GetStatisticsAsync(id, startDate, endDate);
        return Ok(stats);
    }
}

public class UpdateStatusDto
{
    public int Status { get; set; }
    public string? Reason { get; set; }
}
