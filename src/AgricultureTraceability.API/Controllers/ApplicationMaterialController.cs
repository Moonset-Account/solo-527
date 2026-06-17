using AgricultureTraceability.API.Dtos;
using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/material")]
[ApiController]
public class ApplicationMaterialController : ControllerBase
{
    private readonly IApplicationMaterialService _materialService;
    private readonly IBatchOperationService _batchOperationService;

    public ApplicationMaterialController(IApplicationMaterialService materialService, IBatchOperationService batchOperationService)
    {
        _materialService = materialService;
        _batchOperationService = batchOperationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApplicationMaterial>>> GetAllMaterials(
        [FromQuery] MaterialStatus? status = null,
        [FromQuery] string? materialType = null)
    {
        var materials = await _materialService.GetAllMaterialsAsync(status, materialType);
        return Ok(materials);
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<IEnumerable<ApplicationMaterial>>> GetMaterialsByBatch(Guid batchId)
    {
        var materials = await _materialService.GetMaterialsByBatchAsync(batchId);
        return Ok(materials);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<MaterialStatsDto>> GetMaterialStats()
    {
        var stats = await _materialService.GetMaterialStatsAsync();
        return Ok(stats);
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationMaterial>> CreateMaterial([FromBody] ApplicationMaterial material)
    {
        var result = await _materialService.CreateMaterialAsync(material);
        return CreatedAtAction(nameof(GetAllMaterials), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApplicationMaterial>> UpdateMaterial(Guid id, [FromBody] ApplicationMaterial material)
    {
        var result = await _materialService.UpdateMaterialAsync(id, material);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMaterial(Guid id)
    {
        var result = await _materialService.DeleteMaterialAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpPost("batch/status")]
    public async Task<ActionResult<BatchOperationResultDto>> BatchUpdateStatus([FromBody] BatchMaterialStatusRequest request)
    {
        var result = await _batchOperationService.BatchUpdateMaterialStatusAsync(
            request.Ids,
            request.NewStatus,
            request.OperatorId,
            request.Remark
        );
        return Ok(result);
    }
}
