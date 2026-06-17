using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PlotController : ControllerBase
{
    private readonly IPlotService _plotService;

    public PlotController(IPlotService plotService)
    {
        _plotService = plotService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Plot>>> GetAllPlots()
    {
        var plots = await _plotService.GetAllPlotsAsync();
        return Ok(plots);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Plot>> GetPlotById(Guid id)
    {
        var plot = await _plotService.GetPlotByIdAsync(id);
        if (plot == null)
        {
            return NotFound();
        }
        return Ok(plot);
    }

    [HttpPost]
    public async Task<ActionResult<Plot>> CreatePlot([FromBody] Plot plot)
    {
        var result = await _plotService.CreatePlotAsync(plot);
        return CreatedAtAction(nameof(GetPlotById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Plot>> UpdatePlot(Guid id, [FromBody] Plot plot)
    {
        var result = await _plotService.UpdatePlotAsync(id, plot);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlot(Guid id)
    {
        var result = await _plotService.DeletePlotAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
