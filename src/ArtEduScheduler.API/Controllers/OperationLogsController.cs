using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Principal")]
public class OperationLogsController : ControllerBase
{
    private readonly IOperationLogService _logService;

    public OperationLogsController(IOperationLogService logService)
    {
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<List<OperationLogDto>>> GetLogs(
        [FromQuery] string? entityType = null,
        [FromQuery] int? entityId = null,
        [FromQuery] OperationType? type = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var logs = await _logService.GetLogsAsync(entityType, entityId, type, startDate, endDate);
        return Ok(logs);
    }
}
