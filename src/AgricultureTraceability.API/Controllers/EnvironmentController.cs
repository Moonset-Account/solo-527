using AgricultureTraceability.API.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EnvironmentController : ControllerBase
{
    private readonly IEnvironmentMonitorService _environmentService;
    private readonly IAlertService _alertService;

    public EnvironmentController(IEnvironmentMonitorService environmentService, IAlertService alertService)
    {
        _environmentService = environmentService;
        _alertService = alertService;
    }

    [HttpGet("plot/{plotId}/recent")]
    public async Task<ActionResult<IEnumerable<EnvironmentData>>> GetRecentData(Guid plotId, [FromQuery] int minutes = 60)
    {
        var data = await _environmentService.GetRecentDataAsync(plotId, minutes);
        return Ok(data);
    }

    [HttpGet("plot/{plotId}/range")]
    public async Task<ActionResult<IEnumerable<EnvironmentData>>> GetDataByDateRange(Guid plotId, [FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var data = await _environmentService.GetDataByDateRangeAsync(plotId, start, end);
        return Ok(data);
    }

    [HttpGet("latest")]
    public async Task<ActionResult<Dictionary<Guid, EnvironmentData>>> GetAllPlotsLatestData()
    {
        var data = await _environmentService.GetAllPlotsLatestDataAsync();
        return Ok(data);
    }

    [HttpPost("record")]
    public async Task<ActionResult<EnvironmentData>> RecordData([FromBody] RecordDataDto dto)
    {
        var result = await _environmentService.RecordDataAsync(
            dto.PlotId,
            dto.Temperature,
            dto.Humidity,
            dto.SoilMoisture,
            dto.LightIntensity,
            dto.Co2Level
        );
        await _alertService.CheckAndGenerateAlertsAsync();
        return CreatedAtAction(nameof(GetRecentData), new { plotId = dto.PlotId }, result);
    }
}
