
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;
using GridEventManagement.Web.Services;

namespace GridEventManagement.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly IResidentService _residentService;

    public ResidentsController(IResidentService residentService)
    {
        _residentService = residentService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ResidentDto>>> GetPagedResidents([FromQuery] ResidentQueryDto query)
    {
        var result = await _residentService.GetPagedResidentsAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ResidentDto>> GetResidentById(int id)
    {
        var resident = await _residentService.GetResidentByIdAsync(id);
        if (resident == null)
        {
            return NotFound();
        }
        return Ok(resident);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Manager) + "," + nameof(UserRole.GridWorker))]
    public async Task<ActionResult<ResidentDto>> CreateResident([FromBody] CreateResidentDto request)
    {
        var result = await _residentService.CreateResidentAsync(request);
        return CreatedAtAction(nameof(GetResidentById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Manager) + "," + nameof(UserRole.GridWorker))]
    public async Task<ActionResult<ResidentDto>> UpdateResident(int id, [FromBody] UpdateResidentDto request)
    {
        var result = await _residentService.UpdateResidentAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Manager))]
    public async Task<IActionResult> DeleteResident(int id)
    {
        var result = await _residentService.DeleteResidentAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("export")]
    [Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Manager))]
    public async Task<IActionResult> ExportResidents([FromQuery] ResidentQueryDto query)
    {
        var csvBytes = await _residentService.ExportResidentsToCsvAsync(query);
        return File(csvBytes, "text/csv; charset=utf-8", $"residents_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }
}
