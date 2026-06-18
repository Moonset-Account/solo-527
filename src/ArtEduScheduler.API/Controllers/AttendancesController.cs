using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendancesController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendancesController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("schedule/{scheduleId}")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<List<AttendanceDto>>> GetScheduleAttendances(int scheduleId)
    {
        var attendances = await _attendanceService.GetScheduleAttendancesAsync(scheduleId);
        return Ok(attendances);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<AttendanceDto>>> GetMyAttendances(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var studentId = GetOperatorId();
        var attendances = await _attendanceService.GetStudentAttendancesAsync(studentId, startDate, endDate);
        return Ok(attendances);
    }

    [HttpPost("mark")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<AttendanceDto>> MarkAttendance([FromBody] MarkAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.MarkAttendanceAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<BatchOperationDto>> BatchMarkAttendances([FromBody] BatchAttendanceDto dto)
    {
        try
        {
            var result = await _attendanceService.BatchMarkAttendancesAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
