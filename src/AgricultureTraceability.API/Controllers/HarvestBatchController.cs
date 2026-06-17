using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HarvestBatchController : ControllerBase
{
    private readonly IHarvestBatchService _batchService;

    public HarvestBatchController(IHarvestBatchService batchService)
    {
        _batchService = batchService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestBatch>>> GetAllBatches(
        [FromQuery] string? batchNumber = null,
        [FromQuery] Guid? plotId = null,
        [FromQuery] Guid? varietyId = null,
        [FromQuery] BatchStatus? status = null)
    {
        var batches = await _batchService.GetAllBatchesAsync(batchNumber, plotId, varietyId, status);
        return Ok(batches);
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<HarvestBatch>>> GetPagedBatches(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] BatchFilterDto filter)
    {
        filter.Page = page;
        filter.PageSize = pageSize;
        var result = await _batchService.GetPagedBatchesAsync(page, pageSize, filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HarvestBatch>> GetBatchById(Guid id)
    {
        var batch = await _batchService.GetBatchByIdAsync(id);
        if (batch == null)
        {
            return NotFound();
        }
        return Ok(batch);
    }

    [HttpGet("number/{batchNumber}")]
    public async Task<ActionResult<HarvestBatch>> GetBatchByNumber(string batchNumber)
    {
        var batch = await _batchService.GetBatchByNumberAsync(batchNumber);
        if (batch == null)
        {
            return NotFound();
        }
        return Ok(batch);
    }

    [HttpPost]
    public async Task<ActionResult<HarvestBatch>> CreateBatch([FromBody] HarvestBatch batch)
    {
        var result = await _batchService.CreateBatchAsync(batch);
        return CreatedAtAction(nameof(GetBatchById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HarvestBatch>> UpdateBatch(Guid id, [FromBody] HarvestBatch batch)
    {
        var result = await _batchService.UpdateBatchAsync(id, batch);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBatch(Guid id)
    {
        var result = await _batchService.DeleteBatchAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("{id}/qrcode")]
    public async Task<IActionResult> GenerateQrCode(Guid id)
    {
        var qrCodeBytes = await _batchService.GenerateQrCodeAsync(id);
        return File(qrCodeBytes, "image/png");
    }
}
