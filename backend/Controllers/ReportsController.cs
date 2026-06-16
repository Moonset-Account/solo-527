
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Services;

namespace GridEventManagement.Web.Controllers;

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

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardReportDto>> GetDashboardReport([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetDashboardReportAsync(query);
        return Ok(result);
    }

    [HttpGet("event-status")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<List<EventStatusReportDto>>> GetEventStatusReport([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetEventStatusReportAsync(query);
        return Ok(result);
    }

    [HttpGet("event-type")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<List<EventTypeReportDto>>> GetEventTypeReport([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetEventTypeReportAsync(query);
        return Ok(result);
    }

    [HttpGet("grid")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<List<GridReportDto>>> GetGridReport([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetGridReportAsync(query);
        return Ok(result);
    }

    [HttpGet("monthly-trend")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<List<MonthlyTrendDto>>> GetMonthlyTrend([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetMonthlyTrendAsync(query);
        return Ok(result);
    }

    [HttpGet("closure")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<ClosureReportDto>> GetClosureReport([FromQuery] ReportQueryDto query)
    {
        var result = await _reportService.GetClosureReportAsync(query);
        return Ok(result);
    }
}
