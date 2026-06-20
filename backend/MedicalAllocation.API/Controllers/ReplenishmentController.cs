using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace MedicalAllocation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReplenishmentController : ControllerBase
{
    private readonly IReplenishmentService _replenishmentService;
    private readonly IDistributedCache _cache;

    public ReplenishmentController(IReplenishmentService replenishmentService, IDistributedCache cache)
    {
        _replenishmentService = replenishmentService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReplenishmentSuggestionDTO>>> GetAllAsync([FromQuery] ReplenishmentQueryDTO query, CancellationToken cancellationToken)
    {
        var result = await _replenishmentService.GetAllAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReplenishmentSuggestionDTO>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _replenishmentService.GetByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ReplenishmentSuggestionDTO>> CreateAsync([FromBody] CreateReplenishmentDTO dto, CancellationToken cancellationToken)
    {
        var result = await _replenishmentService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = result.Id }, result);
    }

    [HttpPut("{id}/mark-processed")]
    public async Task<IActionResult> MarkAsProcessedAsync(int id, [FromBody] int processedByUserId, CancellationToken cancellationToken)
    {
        try
        {
            await _replenishmentService.MarkAsProcessedAsync(id, processedByUserId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("batch-process")]
    public async Task<IActionResult> BatchMarkAsProcessedAsync([FromBody] BatchMarkProcessedRequest request, CancellationToken cancellationToken)
    {
        await _replenishmentService.BatchMarkAsProcessedAsync(request.Ids, request.ProcessedByUserId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _replenishmentService.DeleteAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateReplenishmentSuggestionsAsync(CancellationToken cancellationToken)
    {
        await _replenishmentService.GenerateReplenishmentSuggestionsAsync(cancellationToken);
        return Ok(new { message = "补货建议生成成功" });
    }

    [HttpGet("pending-count")]
    public async Task<ActionResult<int>> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        var count = await _replenishmentService.GetPendingCountAsync(cancellationToken);
        return Ok(count);
    }
}

public class BatchMarkProcessedRequest
{
    public IEnumerable<int> Ids { get; set; } = new List<int>();
    public int ProcessedByUserId { get; set; }
}
