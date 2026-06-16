
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExternalApiLogsController : ControllerBase
{
    private readonly IExternalApiLogService _externalApiLogService;

    public ExternalApiLogsController(IExternalApiLogService externalApiLogService)
    {
        _externalApiLogService = externalApiLogService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PagedResultDto&lt;ExternalApiLogDto&gt;&gt;&gt;&gt; GetList([FromQuery] ExternalApiLogQueryDto query)
    {
        var result = await _externalApiLogService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;PagedResultDto&lt;ExternalApiLogDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;ExternalApiLogDto&gt;&gt;&gt; GetById(int id)
    {
        var log = await _externalApiLogService.GetByIdAsync(id);
        if (log == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "日志不存在" });

        return Ok(new ApiResultDto&lt;ExternalApiLogDto&gt;
        {
            Success = true,
            Code = 200,
            Data = log
        });
    }

    [HttpGet("failure-summary")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;ApiFailureSummaryDto&gt;&gt;&gt;&gt; GetFailureSummary(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _externalApiLogService.GetFailureSummaryAsync(startDate, endDate);
        return Ok(new ApiResultDto&lt;List&lt;ApiFailureSummaryDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("failed")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;ExternalApiLogDto&gt;&gt;&gt;&gt; GetFailedLogs(
        [FromQuery] string? apiName = null,
        [FromQuery] int? top = 50)
    {
        var result = await _externalApiLogService.GetFailedLogsAsync(apiName, top);
        return Ok(new ApiResultDto&lt;List&lt;ExternalApiLogDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }
}
