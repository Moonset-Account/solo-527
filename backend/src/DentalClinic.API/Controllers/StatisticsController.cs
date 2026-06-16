
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
    public async Task<ActionResult<ApiResultDto<DashboardStatsDto>>> GetDashboardStats([FromQuery] int? clinicId = null)
    {
        var result = await _statisticsService.GetDashboardStatsAsync(clinicId);
        return Ok(new ApiResultDto<DashboardStatsDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("recheck")]
    public async Task<ActionResult<ApiResultDto<RecheckStatsDto>>> GetRecheckStats(
        [FromQuery] int? clinicId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetRecheckStatsAsync(clinicId, startDate, endDate);
        return Ok(new ApiResultDto<RecheckStatsDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("lost-patients")]
    public async Task<ActionResult<ApiResultDto<LostPatientStatsDto>>> GetLostPatientStats(
        [FromQuery] int? clinicId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetLostPatientStatsAsync(clinicId, startDate, endDate);
        return Ok(new ApiResultDto<LostPatientStatsDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("schedule-utilization")]
    public async Task<ActionResult<ApiResultDto<ScheduleUtilizationStatsDto>>> GetScheduleUtilization(
        [FromQuery] int? clinicId = null,
        [FromQuery] int? doctorId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetScheduleUtilizationStatsAsync(clinicId, doctorId, startDate, endDate);
        return Ok(new ApiResultDto<ScheduleUtilizationStatsDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
