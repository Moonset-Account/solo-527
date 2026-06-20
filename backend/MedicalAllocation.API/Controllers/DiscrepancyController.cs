using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAllocation.API.Controllers;

// 管理员功能：管理员要负责差异和签收
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiscrepancyController : ControllerBase
{
    private readonly IDiscrepancyService _discrepancyService;

    public DiscrepancyController(IDiscrepancyService discrepancyService)
    {
        _discrepancyService = discrepancyService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiscrepancyRecordDTO>>> GetAllAsync([FromQuery] DiscrepancyQueryDTO query, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.GetAllAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiscrepancyRecordDTO>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.GetByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    // 管理员功能：从调拨单创建差异记录
    [HttpPost("from-allocation/{allocationId}")]
    public async Task<ActionResult<DiscrepancyRecordDTO>> CreateFromAllocationAsync(int allocationId, [FromBody] DiscrepancyCreateFromAllocationDTO request, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.CreateFromAllocationAsync(allocationId, request.Dto, request.CreatedByUserId, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = result.Id }, result);
    }

    // 管理员功能：签收/解决差异
    [HttpPut("resolve")]
    public async Task<ActionResult<DiscrepancyRecordDTO>> ResolveAsync([FromBody] DiscrepancyResolveDTO dto, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.ResolveAsync(dto, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    // 管理员功能：指定差异负责人
    [HttpPut("{id}/assign-responsible")]
    public async Task<ActionResult<DiscrepancyRecordDTO>> AssignResponsibleAsync(int id, [FromBody] DiscrepancyAssignResponsibleDTO request, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.AssignResponsibleAsync(id, request.ResponsibleUserId, request.AssignedByUserId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    // 管理员功能：删除差异记录
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var deleted = await _discrepancyService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("open-count")]
    public async Task<ActionResult<int>> GetOpenCountAsync(CancellationToken cancellationToken)
    {
        var count = await _discrepancyService.GetOpenCountAsync(cancellationToken);
        return Ok(count);
    }

    [HttpGet("open")]
    public async Task<ActionResult<IEnumerable<DiscrepancyRecordDTO>>> GetOpenDiscrepanciesAsync([FromQuery] int? responsibleUserId, CancellationToken cancellationToken)
    {
        var result = await _discrepancyService.GetOpenDiscrepanciesAsync(responsibleUserId, cancellationToken);
        return Ok(result);
    }
}
