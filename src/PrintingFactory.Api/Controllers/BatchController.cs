
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Application.Features.Batch.Commands;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BatchController : ControllerBase
{
    private readonly IMediator _mediator;

    public BatchController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("execute")]
    public async Task<ActionResult<BatchProcessResult>> Execute([FromBody] BatchProcessRequest request)
    {
        var command = new ExecuteBatchOperationCommand { Request = request };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("retry/{batchItemId}")]
    public async Task<ActionResult<BatchOperationItemDto>> Retry(
        int batchItemId,
        [FromQuery] BatchOperationType operationType)
    {
        var command = new RetryBatchItemCommand
        {
            BatchItemId = batchItemId,
            OperationType = operationType
        };
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
