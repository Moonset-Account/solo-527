
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Application.Features.Orders.Commands;
using PrintingFactory.Application.Features.Orders.Queries;
using PrintingFactory.Domain.Entities;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetList(
        [FromQuery] int? storeId = null,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? searchKeyword = null,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetOrderListQuery
        {
            StoreId = storeId,
            Status = status,
            StartDate = startDate,
            EndDate = endDate,
            SearchKeyword = searchKeyword,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDetailDto>> GetDetail(int id)
    {
        var query = new GetOrderDetailQuery { Id = id };
        var result = await _mediator.Send(query);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderDto dto)
    {
        var command = new CreateOrderCommand { Order = dto };
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetDetail), new { id = result.Id }, result);
    }

    [HttpPut("progress")]
    public async Task<ActionResult<ProductionProgressDto>> UpdateProgress([FromBody] UpdateProductionProgressDto dto)
    {
        var command = new UpdateProductionProgressCommand { Progress = dto };
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
