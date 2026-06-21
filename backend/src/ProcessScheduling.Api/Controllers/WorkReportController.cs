using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkReportController : ControllerBase
{
    private readonly IWorkReportService _workReportService;

    public WorkReportController(IWorkReportService workReportService)
    {
        _workReportService = workReportService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<WorkReportDto>>> GetPaged(
        [FromQuery] int pageIndex = 0,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? status = null)
    {
        var result = await _workReportService.GetPagedAsync(
            pageIndex,
            pageSize,
            status.HasValue ? (WorkReportStatus)status.Value : null);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkReportDto>> GetById(Guid id)
    {
        var report = await _workReportService.GetByIdAsync(id);
        if (report == null)
            return NotFound();
        return Ok(report);
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<WorkReportDto>>> GetByStatus(int status)
    {
        var reports = await _workReportService.GetByStatusAsync((WorkReportStatus)status);
        return Ok(reports);
    }

    [HttpPost]
    public async Task<ActionResult<WorkReportDto>> Create([FromBody] CreateWorkReportDto dto)
    {
        var report = await _workReportService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
    }

    [HttpPost("audit")]
    [Authorize(Policy = "WorkshopDirectorOrAdmin")]
    public async Task<ActionResult<WorkReportDto>> Audit([FromBody] AuditWorkReportDto dto)
    {
        try
        {
            var report = await _workReportService.AuditAsync(dto);
            return Ok(report);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
