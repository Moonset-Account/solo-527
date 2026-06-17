using AgricultureTraceability.API.Dtos;
using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AlertBatchController : ControllerBase
{
    private readonly IBatchOperationService _batchOperationService;

    public AlertBatchController(IBatchOperationService batchOperationService)
    {
        _batchOperationService = batchOperationService;
    }

    [HttpPost("status")]
    public async Task<ActionResult<BatchOperationResultDto>> BatchUpdateAlertStatus([FromBody] BatchAlertStatusRequest request)
    {
        var result = await _batchOperationService.BatchUpdateAlertStatusAsync(
            request.Ids,
            request.NewStatus,
            request.OperatorId
        );
        return Ok(result);
    }
}
