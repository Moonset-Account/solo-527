
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Application.Features.Equipment.Queries;
using PrintingFactory.Domain.Entities;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
    private readonly IMediator _mediator;

    public EquipmentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<EquipmentDto>>> GetList(
        [FromQuery] EquipmentStatus? status = null,
        [FromQuery] string? type = null)
    {
        var query = new GetEquipmentListQuery
        {
            Status = status,
            Type = type
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
