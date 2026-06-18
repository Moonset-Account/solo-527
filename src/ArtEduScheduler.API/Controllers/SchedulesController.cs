using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<List<ScheduleDto>>> GetSchedules(
        [FromQuery] int? classId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var schedules = await _scheduleService.GetSchedulesAsync(classId, startDate, endDate);
        return Ok(schedules);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleDto>> GetSchedule(int id)
    {
        var schedule = await _scheduleService.GetScheduleByIdAsync(id);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<ScheduleDto>>> GetMySchedules(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var studentId = GetOperatorId();
        var schedules = await _scheduleService.GetStudentSchedulesAsync(studentId, startDate, endDate);
        return Ok(schedules);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<ScheduleDto>> CreateSchedule([FromBody] CreateScheduleDto dto)
    {
        try
        {
            var schedule = await _scheduleService.CreateScheduleAsync(dto, GetOperatorId());
            return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, schedule);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("reschedule")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<ScheduleDto>> Reschedule([FromBody] RescheduleDto dto)
    {
        try
        {
            var schedule = await _scheduleService.RescheduleAsync(dto, GetOperatorId());
            return Ok(schedule);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<IActionResult> CancelSchedule(int id, [FromBody] CancelScheduleDto dto)
    {
        try
        {
            await _scheduleService.CancelScheduleAsync(id, dto.Reason, GetOperatorId());
            return Ok(new { message = "课表已取消" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<BatchOperationDto>> BatchCreateSchedules([FromBody] List<CreateScheduleDto> dtos)
    {
        var result = await _scheduleService.BatchCreateSchedulesAsync(dtos, GetOperatorId());
        return Ok(result);
    }
}

public class CancelScheduleDto
{
    public string Reason { get; set; } = string.Empty;
}
