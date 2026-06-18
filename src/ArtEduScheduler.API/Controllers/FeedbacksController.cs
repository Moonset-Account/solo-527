using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbacksController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbacksController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("work")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<List<WorkFeedbackDto>>> GetWorkFeedbacks(
        [FromQuery] int? studentId = null,
        [FromQuery] int? scheduleId = null)
    {
        var feedbacks = await _feedbackService.GetWorkFeedbacksAsync(studentId, scheduleId);
        return Ok(feedbacks);
    }

    [HttpGet("work/my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<WorkFeedbackDto>>> GetMyWorkFeedbacks()
    {
        var studentId = GetOperatorId();
        var feedbacks = await _feedbackService.GetStudentWorkFeedbacksAsync(studentId);
        return Ok(feedbacks);
    }

    [HttpPost("work")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<WorkFeedbackDto>> CreateWorkFeedback([FromBody] CreateWorkFeedbackDto dto)
    {
        try
        {
            var result = await _feedbackService.CreateWorkFeedbackAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("work/{id}/notify")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<IActionResult> NotifyParentForWorkFeedback(int id)
    {
        try
        {
            await _feedbackService.NotifyParentForWorkFeedbackAsync(id, GetOperatorId());
            return Ok(new { message = "已通知家长" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("homeschool")]
    public async Task<ActionResult<List<HomeSchoolFeedbackDto>>> GetHomeSchoolFeedbacks(
        [FromQuery] int? studentId = null,
        [FromQuery] bool pendingRemindersOnly = false)
    {
        var feedbacks = await _feedbackService.GetHomeSchoolFeedbacksAsync(studentId, pendingRemindersOnly);
        return Ok(feedbacks);
    }

    [HttpPost("homeschool")]
    [Authorize(Roles = "Admin,Principal,Teacher")]
    public async Task<ActionResult<HomeSchoolFeedbackDto>> CreateHomeSchoolFeedback([FromBody] CreateHomeSchoolFeedbackDto dto)
    {
        try
        {
            var result = await _feedbackService.CreateHomeSchoolFeedbackAsync(dto, GetOperatorId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("homeschool/{id}/read")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> MarkHomeFeedbackAsRead(int id)
    {
        var studentId = GetOperatorId();
        await _feedbackService.MarkHomeFeedbackAsReadAsync(id, studentId);
        return Ok(new { message = "已标记为已读" });
    }
}
