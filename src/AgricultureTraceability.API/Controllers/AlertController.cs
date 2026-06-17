using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AlertController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<Alert>>> GetActiveAlerts()
    {
        var alerts = await _alertService.GetActiveAlertsAsync();
        return Ok(alerts);
    }

    [HttpGet("plot/{plotId}")]
    public async Task<ActionResult<IEnumerable<Alert>>> GetAlertsByPlot(Guid plotId)
    {
        var alerts = await _alertService.GetAlertsByPlotAsync(plotId);
        return Ok(alerts);
    }

    [HttpGet("range")]
    public async Task<ActionResult<IEnumerable<Alert>>> GetAlertsByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var alerts = await _alertService.GetAlertsByDateRangeAsync(start, end);
        return Ok(alerts);
    }

    [HttpPut("{id}/acknowledge")]
    public async Task<ActionResult<Alert>> AcknowledgeAlert(Guid id, [FromQuery] Guid userId)
    {
        var result = await _alertService.AcknowledgeAlertAsync(id, userId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("{id}/resolve")]
    public async Task<ActionResult<Alert>> ResolveAlert(Guid id, [FromQuery] Guid userId)
    {
        var result = await _alertService.ResolveAlertAsync(id, userId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }
}
