using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;

namespace ProcessScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "WorkshopDirectorOrAdmin")]
public class ReviewController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("adjustments/{entityType}/{entityId}")]
    public async Task<ActionResult<IEnumerable<AdjustmentRecordDto>>> GetAdjustmentHistory(
        string entityType, Guid entityId)
    {
        var records = await _reviewService.GetAdjustmentHistoryAsync(entityType, entityId);
        return Ok(records);
    }

    [HttpGet("mold/{moldId}/history")]
    public async Task<ActionResult<IEnumerable<MoldRecordDto>>> GetMoldHistory(Guid moldId)
    {
        var records = await _reviewService.GetMoldHistoryAsync(moldId);
        return Ok(records);
    }

    [HttpGet("qc/workorder/{workOrderId}")]
    public async Task<ActionResult<IEnumerable<QCResultDto>>> GetQCHistory(Guid workOrderId)
    {
        var results = await _reviewService.GetQCHistoryAsync(workOrderId);
        return Ok(results);
    }

    [HttpGet("operation-logs")]
    public async Task<ActionResult<IEnumerable<OperationLogDto>>> GetOperationLogs(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? module = null)
    {
        var logs = await _reviewService.GetOperationLogsAsync(startDate, endDate, module);
        return Ok(logs);
    }
}
