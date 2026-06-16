
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("dashboard")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;DashboardStatsDto&gt;&gt;&gt; GetDashboardStats([FromQuery] int? clinicId = null)
    {
        var result = await _statisticsService.GetDashboardStatsAsync(clinicId);
        return Ok(new ApiResultDto&lt;DashboardStatsDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("recheck")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;RecheckStatsDto&gt;&gt;&gt; GetRecheckStats(
        [FromQuery] int? clinicId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetRecheckStatsAsync(clinicId, startDate, endDate);
        return Ok(new ApiResultDto&lt;RecheckStatsDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("lost-patients")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;LostPatientStatsDto&gt;&gt;&gt; GetLostPatientStats(
        [FromQuery] int? clinicId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetLostPatientStatsAsync(clinicId, startDate, endDate);
        return Ok(new ApiResultDto&lt;LostPatientStatsDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("schedule-utilization")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;ScheduleUtilizationStatsDto&gt;&gt;&gt; GetScheduleUtilization(
        [FromQuery] int? clinicId = null,
        [FromQuery] int? doctorId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetScheduleUtilizationStatsAsync(clinicId, doctorId, startDate, endDate);
        return Ok(new ApiResultDto&lt;ScheduleUtilizationStatsDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
