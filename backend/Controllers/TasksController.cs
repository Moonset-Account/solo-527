
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Services;

namespace GridEventManagement.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet("patrol")]
    public async Task<ActionResult<PagedResultDto<PatrolTaskDto>>> GetPagedPatrolTasks([FromQuery] PatrolTaskQueryDto query)
    {
        var result = await _taskService.GetPagedPatrolTasksAsync(query);
        return Ok(result);
    }

    [HttpGet("patrol/{id:int}")]
    public async Task<ActionResult<PatrolTaskDto>> GetPatrolTaskById(int id)
    {
        var task = await _taskService.GetPatrolTaskByIdAsync(id);
        if (task == null)
        {
            return NotFound();
        }
        return Ok(task);
    }

    [HttpPost("patrol")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<PatrolTaskDto>> CreatePatrolTask([FromBody] CreatePatrolTaskDto request)
    {
        var result = await _taskService.CreatePatrolTaskAsync(request);
        return CreatedAtAction(nameof(GetPatrolTaskById), new { id = result.Id }, result);
    }

    [HttpPut("patrol/{id:int}")]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<PatrolTaskDto>> UpdatePatrolTask(int id, [FromBody] UpdatePatrolTaskDto request)
    {
        var result = await _taskService.UpdatePatrolTaskAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("patrol/{id:int}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> DeletePatrolTask(int id)
    {
        var result = await _taskService.DeletePatrolTaskAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("patrol/{eventId:int}/reviews")]
    public async Task<ActionResult<List<ReviewDto>>> GetReviewsByEventId(int eventId)
    {
        var reviews = await _taskService.GetReviewsByEventIdAsync(eventId);
        return Ok(reviews);
    }

    [HttpGet("reviews/{id:int}")]
    public async Task<ActionResult<ReviewDto>> GetReviewById(int id)
    {
        var review = await _taskService.GetReviewByIdAsync(id);
        if (review == null)
        {
            return NotFound();
        }
        return Ok(review);
    }

    [HttpPost("reviews")]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto request)
    {
        var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _taskService.CreateReviewAsync(request, reviewerId);
        if (result == null)
        {
            return NotFound();
        }
        return CreatedAtAction(nameof(GetReviewById), new { id = result.Id }, result);
    }

    [HttpGet("visits/{id:int}")]
    public async Task<ActionResult<VisitDto>> GetVisitById(int id)
    {
        var visit = await _taskService.GetVisitByIdAsync(id);
        if (visit == null)
        {
            return NotFound();
        }
        return Ok(visit);
    }

    [HttpGet("patrol/{eventId:int}/visits")]
    public async Task<ActionResult<List<VisitDto>>> GetVisitsByEventId(int eventId)
    {
        var visits = await _taskService.GetVisitsByEventIdAsync(eventId);
        return Ok(visits);
    }

    [HttpPost("visits")]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<VisitDto>> CreateVisit([FromBody] CreateVisitDto request)
    {
        var result = await _taskService.CreateVisitAsync(request);
        if (result == null)
        {
            return NotFound();
        }
        return CreatedAtAction(nameof(GetVisitById), new { id = result.Id }, result);
    }

    [HttpPut("visits/{id:int}")]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<VisitDto>> UpdateVisit(int id, [FromBody] UpdateVisitDto request)
    {
        var result = await _taskService.UpdateVisitAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }
}
