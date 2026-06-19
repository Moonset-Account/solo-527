using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;
using CoworkingBooking.Application.Interfaces;
using CoworkingBooking.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.SuperAdmin))]
public class LogsController : ControllerBase
{
    private readonly IOperationLogService _logService;

    public LogsController(IOperationLogService logService)
    {
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OperationLogDto>>>> GetList([FromQuery] OperationLogQuery query)
    {
        var result = await _logService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] OperationLogQuery query)
    {
        var result = await _logService.ExportLogsAsync(query);
        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"operation_logs_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}
