using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Principal,AdmissionAdvisor")]
public class HoursWarningsController : ControllerBase
{
    private readonly IHoursWarningService _warningService;

    public HoursWarningsController(IHoursWarningService warningService)
    {
        _warningService = warningService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<List<HoursWarningDto>>> GetWarnings([FromQuery] bool onlyUnnotified = false)
    {
        var warnings = await _warningService.GetActiveWarningsAsync(onlyUnnotified);
        return Ok(warnings);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<List<HoursWarningDto>>> GetStudentWarnings(int studentId)
    {
        var warnings = await _warningService.GetStudentWarningsAsync(studentId);
        return Ok(warnings);
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> MarkResolved(int id)
    {
        try
        {
            await _warningService.MarkWarningResolvedAsync(id, GetOperatorId());
            return Ok(new { message = "已标记为已处理" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
