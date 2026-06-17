using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BatchOperationController : ControllerBase
{
    private readonly IBatchOperationService _batchOperationService;

    public BatchOperationController(IBatchOperationService batchOperationService)
    {
        _batchOperationService = batchOperationService;
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<BatchOperation>>> GetRecentOperations([FromQuery] int count = 20)
    {
        var operations = await _batchOperationService.GetRecentOperationsAsync(count);
        return Ok(operations);
    }

    [HttpPost("{id}/retry")]
    public async Task<ActionResult<BatchOperationResultDto>> RetryFailedItems(Guid id, [FromQuery] Guid operatorId)
    {
        var result = await _batchOperationService.RetryFailedItemsAsync(id, operatorId);
        return Ok(result);
    }
}
