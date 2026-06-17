using AgricultureTraceability.API.Dtos;
using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IBatchOperationService _batchOperationService;

    public OrderController(IOrderService orderService, IBatchOperationService batchOperationService)
    {
        _orderService = orderService;
        _batchOperationService = batchOperationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetAllOrders(
        [FromQuery] string? orderNumber = null,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] Guid? batchId = null)
    {
        var orders = await _orderService.GetAllOrdersAsync(orderNumber, status, batchId);
        return Ok(orders);
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<Order>>> GetPagedOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] OrderFilterDto filter)
    {
        filter.Page = page;
        filter.PageSize = pageSize;
        var result = await _orderService.GetPagedOrdersAsync(page, pageSize, filter);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<FulfillmentStatsDto>> GetFulfillmentStats()
    {
        var stats = await _orderService.GetFulfillmentStatsAsync();
        return Ok(stats);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrderById(Guid id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null)
        {
            return NotFound();
        }
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] Order order)
    {
        var result = await _orderService.CreateOrderAsync(order);
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Order>> UpdateOrder(Guid id, [FromBody] Order order)
    {
        var result = await _orderService.UpdateOrderAsync(id, order);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id)
    {
        var result = await _orderService.DeleteOrderAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpPost("batch/status")]
    public async Task<ActionResult<BatchOperationResultDto>> BatchUpdateOrderStatus([FromBody] BatchOrderStatusRequest request)
    {
        var result = await _batchOperationService.BatchUpdateOrderStatusAsync(
            request.Ids,
            request.NewStatus,
            request.OperatorId
        );
        return Ok(result);
    }
}
