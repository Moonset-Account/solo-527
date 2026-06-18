using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeavesController : ControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeavesController(ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<List<LeaveRecordDto>>> GetLeaves(
        [FromQuery] int? studentId = null,
        [FromQuery] LeaveStatus? status = null)
    {
        var records = await _leaveService.GetLeaveRecordsAsync(studentId, status);
        return Ok(records);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<LeaveRecordDto>>> GetMyLeaves()
    {
        var studentId = GetOperatorId();
        var records = await _leaveService.GetLeaveRecordsAsync(studentId);
        return Ok(records);
    }

    [HttpPost]
    public async Task<ActionResult<LeaveRecordDto>> CreateLeave([FromBody] CreateLeaveDto dto)
    {
        try
        {
            var result = await _leaveService.CreateLeaveAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("process")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<LeaveRecordDto>> ProcessLeave([FromBody] ProcessLeaveDto dto)
    {
        try
        {
            var result = await _leaveService.ProcessLeaveAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
