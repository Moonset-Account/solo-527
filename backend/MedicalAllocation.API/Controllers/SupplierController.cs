using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAllocation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupplierController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SupplierController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet("suppliers")]
    public async Task<ActionResult<IEnumerable<SupplierDTO>>> GetAllSuppliersAsync([FromQuery] string? keyword, [FromQuery] bool? isActive, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetAllSuppliersAsync(keyword, isActive, cancellationToken);
        return Ok(result);
    }

    [HttpGet("suppliers/{id}")]
    public async Task<ActionResult<SupplierDTO>> GetSupplierByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetSupplierByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost("suppliers")]
    public async Task<ActionResult<SupplierDTO>> CreateSupplierAsync([FromBody] SupplierDTO dto, CancellationToken cancellationToken)
    {
        var result = await _supplierService.CreateSupplierAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetSupplierByIdAsync), new { id = result.Id }, result);
    }

    [HttpPut("suppliers")]
    public async Task<ActionResult<SupplierDTO>> UpdateSupplierAsync([FromBody] SupplierDTO dto, CancellationToken cancellationToken)
    {
        var result = await _supplierService.UpdateSupplierAsync(dto, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("suppliers/{id}")]
    public async Task<IActionResult> DeleteSupplierAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.DeleteSupplierAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpPut("suppliers/{id}/toggle-active")]
    public async Task<IActionResult> ToggleSupplierActiveAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.ToggleSupplierActiveAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("replies")]
    public async Task<ActionResult<IEnumerable<SupplierReplyDTO>>> GetRepliesAsync([FromQuery] SupplierReplyQueryDTO query, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetRepliesAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("replies/{id}")]
    public async Task<ActionResult<SupplierReplyDTO>> GetReplyByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.GetReplyByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost("replies")]
    public async Task<ActionResult<SupplierReplyDTO>> CreateReplyAsync([FromBody] SupplierReplyCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _supplierService.CreateReplyAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetReplyByIdAsync), new { id = result.Id }, result);
    }

    [HttpPut("replies/{id}/status")]
    public async Task<ActionResult<SupplierReplyDTO>> UpdateReplyStatusAsync(int id, [FromBody] UpdateReplyStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _supplierService.UpdateReplyStatusAsync(id, request.Status, request.UserId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("replies/{id}/confirm")]
    public async Task<ActionResult<SupplierReplyDTO>> ConfirmReplyAsync(int id, [FromBody] int confirmedByUserId, CancellationToken cancellationToken)
    {
        var result = await _supplierService.ConfirmReplyAsync(id, confirmedByUserId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("replies/{id}/record-delay")]
    public async Task<ActionResult<SupplierReplyDTO>> RecordDelayAsync(int id, [FromBody] RecordDelayRequest request, CancellationToken cancellationToken)
    {
        var result = await _supplierService.RecordDelayAsync(id, request.DelayReason, request.DelayDays, request.UserId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("replies/{id}")]
    public async Task<IActionResult> DeleteReplyAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _supplierService.DeleteReplyAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("replies/pending-count")]
    public async Task<ActionResult<int>> GetPendingReplyCountAsync(CancellationToken cancellationToken)
    {
        var count = await _supplierService.GetPendingReplyCountAsync(cancellationToken);
        return Ok(count);
    }
}

public class UpdateReplyStatusRequest
{
    public SupplierReplyStatus Status { get; set; }
    public int? UserId { get; set; }
}

public class RecordDelayRequest
{
    public string DelayReason { get; set; } = string.Empty;
    public int DelayDays { get; set; }
    public int? UserId { get; set; }
}
