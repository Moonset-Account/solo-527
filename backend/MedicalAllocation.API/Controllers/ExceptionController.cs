using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAllocation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExceptionController : ControllerBase
{
    private readonly IExceptionService _exceptionService;

    public ExceptionController(IExceptionService exceptionService)
    {
        _exceptionService = exceptionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExceptionRecordDTO>>> GetAllAsync([FromQuery] ExceptionQueryDTO query, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.GetAllAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExceptionRecordDTO>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.GetByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ExceptionRecordDTO>> CreateAsync([FromBody] ExceptionCreateDTO dto, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = result.Id }, result);
    }

    [HttpPut("resolve")]
    public async Task<ActionResult<ExceptionRecordDTO>> ResolveAsync([FromBody] ExceptionResolveDTO dto, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.ResolveAsync(dto, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("{id}/assign-responsible")]
    public async Task<ActionResult<ExceptionRecordDTO>> AssignResponsibleAsync(int id, [FromBody] ExceptionAssignResponsibleDTO request, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.AssignResponsibleAsync(id, request.ResponsibleUserId, request.AssignedByUserId, cancellationToken);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var deleted = await _exceptionService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("open-count")]
    public async Task<ActionResult<int>> GetOpenCountAsync(CancellationToken cancellationToken)
    {
        var count = await _exceptionService.GetOpenCountAsync(cancellationToken);
        return Ok(count);
    }

    [HttpGet("open")]
    public async Task<ActionResult<IEnumerable<ExceptionRecordDTO>>> GetOpenExceptionsAsync([FromQuery] int? responsibleUserId, CancellationToken cancellationToken)
    {
        var result = await _exceptionService.GetOpenExceptionsAsync(responsibleUserId, cancellationToken);
        return Ok(result);
    }
}
