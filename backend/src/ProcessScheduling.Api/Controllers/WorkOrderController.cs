using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkOrderController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;

    public WorkOrderController(IWorkOrderService workOrderService)
    {
        _workOrderService = workOrderService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkOrderDto>>> GetAll()
    {
        var workOrders = await _workOrderService.GetAllAsync();
        return Ok(workOrders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkOrderDto>> GetById(Guid id)
    {
        var workOrder = await _workOrderService.GetByIdAsync(id);
        if (workOrder == null)
            return NotFound();
        return Ok(workOrder);
    }

    [HttpPost]
    [Authorize(Policy = "WorkshopDirectorOrAdmin")]
    public async Task<ActionResult<WorkOrderDto>> Create([FromBody] WorkOrderDto dto)
    {
        var workOrder = await _workOrderService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = workOrder.Id }, workOrder);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "WorkshopDirectorOrAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] WorkOrderDto dto)
    {
        if (id != dto.Id)
            return BadRequest();

        try
        {
            await _workOrderService.UpdateAsync(dto);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
