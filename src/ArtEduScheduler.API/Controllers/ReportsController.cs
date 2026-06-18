using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("monthly/{year}/{month}")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<List<MonthlyReportDto>>> GetMonthlyReports(int year, int month)
    {
        var reports = await _reportService.GetMonthlyReportsAsync(year, month);
        return Ok(reports);
    }

    [HttpGet("monthly/{year}/{month}/my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<MonthlyReportDto>> GetMyMonthlyReport(int year, int month)
    {
        var studentId = GetUserId();
        var report = await _reportService.GetStudentMonthlyReportAsync(year, month, studentId);
        if (report == null) return NotFound();
        return Ok(report);
    }

    [HttpGet("monthly/{year}/{month}/student/{studentId}")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<MonthlyReportDto>> GetStudentMonthlyReport(int year, int month, int studentId)
    {
        var report = await _reportService.GetStudentMonthlyReportAsync(year, month, studentId);
        if (report == null) return NotFound();
        return Ok(report);
    }

    [HttpPost("monthly/{year}/{month}/generate")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<MonthlyReportDto>> GenerateMonthlyReport(
        int year, int month, [FromQuery] int? studentId = null)
    {
        try
        {
            var report = await _reportService.GenerateMonthlyReportAsync(year, month, studentId);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
