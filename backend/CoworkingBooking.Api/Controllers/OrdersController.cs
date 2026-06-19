using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly CurrentUserService _currentUser;

    public OrdersController(IOrderService orderService, CurrentUserService currentUser)
    {
        _orderService = orderService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> GetList([FromQuery] OrderQuery query)
    {
        var result = await _orderService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id)
    {
        var result = await _orderService.GetByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Create([FromBody] CreateOrderRequest request)
    {
        var result = await _orderService.CreateAsync(request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}/pay")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<ActionResult<ApiResponse>> Pay(Guid id, [FromBody] PayOrderRequest request)
    {
        var result = await _orderService.PayAsync(id, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/cancel")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse>> Cancel(Guid id, [FromQuery] string reason)
    {
        var result = await _orderService.CancelAsync(id, reason, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{orderId}/fulfillments/{fulfillmentId}")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Consultant) + "," + nameof(UserRole.ConsultantManager))]
    public async Task<ActionResult<ApiResponse>> UpdateFulfillment(Guid orderId, Guid fulfillmentId, [FromBody] UpdateFulfillmentRequest request)
    {
        var result = await _orderService.UpdateFulfillmentAsync(orderId, fulfillmentId, request, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("export")]
    [Authorize(Roles = nameof(UserRole.SuperAdmin) + "," + nameof(UserRole.Finance))]
    public async Task<IActionResult> Export([FromQuery] OrderQuery query)
    {
        var result = await _orderService.ExportOrdersAsync(query);
        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"orders_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}
