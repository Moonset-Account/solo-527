
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Application.Features.Quality.Commands;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QualityController : ControllerBase
{
    private readonly IMediator _mediator;

    public QualityController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("inspection")]
    public async Task<ActionResult<QualityInspectionDto>> CreateInspection([FromBody] CreateQualityInspectionDto dto)
    {
        var command = new CreateQualityInspectionCommand { Inspection = dto };
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("issue")]
    public async Task<ActionResult<QualityIssueDto>> CreateIssue([FromBody] CreateQualityIssueDto dto)
    {
        var command = new CreateQualityIssueCommand { Issue = dto };
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
