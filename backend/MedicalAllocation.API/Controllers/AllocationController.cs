using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAllocation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AllocationController : ControllerBase
{
    private readonly IAllocationService _allocationService;

    public AllocationController(IAllocationService allocationService)
    {
        _allocationService = allocationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AllocationRequestDTO>>> GetAllAsync([FromQuery] AllocationStatus? status, [FromQuery] int? warehouseId, CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetAllAsync(status, warehouseId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AllocationRequestDTO>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AllocationRequestDTO>> CreateAsync([FromBody] AllocationCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _allocationService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = result.Id }, result);
    }

    [HttpPut("approve")]
    public async Task<ActionResult<AllocationRequestDTO>> ApproveAsync([FromBody] AllocationApproveDTO dto, CancellationToken cancellationToken)
    {
        var result = await _allocationService.ApproveAsync(dto, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("{id}/mark-in-transit")]
    public async Task<ActionResult<AllocationRequestDTO>> MarkInTransitAsync(int id, [FromBody] int userId, CancellationToken cancellationToken)
    {
        var result = await _allocationService.MarkInTransitAsync(id, userId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("receive")]
    public async Task<ActionResult<AllocationRequestDTO>> ReceiveAsync([FromBody] AllocationReceiveDTO dto, CancellationToken cancellationToken)
    {
        var result = await _allocationService.ReceiveAsync(dto, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<AllocationRequestDTO>> CancelAsync(int id, [FromBody] CancelRequest request, CancellationToken cancellationToken)
    {
        var result = await _allocationService.CancelAsync(id, request.UserId, request.Reason, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _allocationService.DeleteAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("pending-approval")]
    public async Task<ActionResult<IEnumerable<AllocationRequestDTO>>> GetPendingApprovalAsync(CancellationToken cancellationToken)
    {
        var result = await _allocationService.GetPendingApprovalAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("pending-approval-count")]
    public async Task<ActionResult<int>> GetPendingApprovalCountAsync(CancellationToken cancellationToken)
    {
        var count = await _allocationService.GetPendingApprovalCountAsync(cancellationToken);
        return Ok(count);
    }
}

public class CancelRequest
{
    public int UserId { get; set; }
    public string? Reason { get; set; }
}
