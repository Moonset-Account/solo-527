using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("production")]
    public async Task<ActionResult<ProductionStatisticsDto>> GetProductionStatistics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] Guid? shiftId = null)
    {
        var stats = await _statisticsService.GetProductionStatisticsAsync(startDate, endDate, shiftId);
        return Ok(stats);
    }

    [HttpGet("equipment-utilization")]
    public async Task<ActionResult<IEnumerable<EquipmentStatisticsDto>>> GetEquipmentUtilization(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var stats = await _statisticsService.GetEquipmentUtilizationAsync(startDate, endDate);
        return Ok(stats);
    }

    [HttpGet("shift-performance")]
    public async Task<ActionResult<IEnumerable<ShiftPerformanceDto>>> GetShiftPerformance(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var stats = await _statisticsService.GetShiftPerformanceAsync(startDate, endDate);
        return Ok(stats);
    }

    [HttpGet("downtime-reasons")]
    public async Task<ActionResult<Dictionary<int, int>>> GetDowntimeReasonDistribution(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var distribution = await _statisticsService.GetDowntimeReasonDistributionAsync(startDate, endDate);
        return Ok(distribution);
    }
}
