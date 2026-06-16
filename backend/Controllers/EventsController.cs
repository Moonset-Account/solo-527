
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Services;

namespace GridEventManagement.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<EventDto>>> GetPagedEvents([FromQuery] EventQueryDto query)
    {
        var result = await _eventService.GetPagedEventsAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDto>> GetEventById(int id)
    {
        var evt = await _eventService.GetEventByIdAsync(id);
        if (evt == null)
        {
            return NotFound();
        }
        return Ok(evt);
    }

    [HttpPost]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<EventDto>> CreateEvent([FromBody] CreateEventDto request)
    {
        var reporterId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _eventService.CreateEventAsync(request, reporterId);
        return CreatedAtAction(nameof(GetEventById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<EventDto>> UpdateEvent(int id, [FromBody] UpdateEventDto request)
    {
        var result = await _eventService.UpdateEventAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "admin,manager,worker")]
    public async Task<ActionResult<EventDto>> ChangeEventStatus(int id, [FromBody] ChangeEventStatusDto request)
    {
        var operatorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _eventService.ChangeEventStatusAsync(id, request, operatorId);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var result = await _eventService.DeleteEventAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("{id:int}/status-logs")]
    public async Task<ActionResult<List<EventStatusLogDto>>> GetEventStatusLogs(int id)
    {
        var logs = await _eventService.GetEventStatusLogsAsync(id);
        return Ok(logs);
    }
}
