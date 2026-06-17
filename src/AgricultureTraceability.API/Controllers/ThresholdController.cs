using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ThresholdController : ControllerBase
{
    private readonly IThresholdService _thresholdService;

    public ThresholdController(IThresholdService thresholdService)
    {
        _thresholdService = thresholdService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Threshold>>> GetAllThresholds()
    {
        var thresholds = await _thresholdService.GetAllThresholdsAsync();
        return Ok(thresholds);
    }

    [HttpGet("plot/{plotId?}")]
    public async Task<ActionResult<IEnumerable<Threshold>>> GetThresholdsByPlot(Guid? plotId = null)
    {
        var thresholds = await _thresholdService.GetThresholdsByPlotAsync(plotId);
        return Ok(thresholds);
    }

    [HttpPost]
    public async Task<ActionResult<Threshold>> CreateOrUpdateThreshold([FromBody] Threshold threshold)
    {
        var result = await _thresholdService.CreateOrUpdateThresholdAsync(threshold);
        return CreatedAtAction(nameof(GetAllThresholds), result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteThreshold(Guid id)
    {
        await _thresholdService.DeleteThresholdAsync(id);
        return NoContent();
    }
}
