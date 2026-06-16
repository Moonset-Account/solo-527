
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GridEventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GridEventsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GridEventDto>>> GetGridEvents()
    {
        var events = await _context.GridEvents
            .Select(e => new GridEventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Status = e.Status,
                Priority = e.Priority,
                Location = e.Location
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GridEventDto>> GetGridEvent(Guid id)
    {
        var gridEvent = await _context.GridEvents.FindAsync(id);

        if (gridEvent == null)
        {
            return NotFound();
        }

        var dto = new GridEventDto
        {
            Id = gridEvent.Id,
            Title = gridEvent.Title,
            Description = gridEvent.Description,
            StartTime = gridEvent.StartTime,
            EndTime = gridEvent.EndTime,
            Status = gridEvent.Status,
            Priority = gridEvent.Priority,
            Location = gridEvent.Location
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<GridEventDto>> PostGridEvent(CreateGridEventDto dto)
    {
        var gridEvent = new GridEvent
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = dto.Status,
            Priority = dto.Priority,
            Location = dto.Location,
            CreatedAt = DateTime.UtcNow
        };

        _context.GridEvents.Add(gridEvent);
        await _context.SaveChangesAsync();

        var resultDto = new GridEventDto
        {
            Id = gridEvent.Id,
            Title = gridEvent.Title,
            Description = gridEvent.Description,
            StartTime = gridEvent.StartTime,
            EndTime = gridEvent.EndTime,
            Status = gridEvent.Status,
            Priority = gridEvent.Priority,
            Location = gridEvent.Location
        };

        return CreatedAtAction(nameof(GetGridEvent), new { id = gridEvent.Id }, resultDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutGridEvent(Guid id, UpdateGridEventDto dto)
    {
        var gridEvent = await _context.GridEvents.FindAsync(id);
        if (gridEvent == null)
        {
            return NotFound();
        }

        gridEvent.Title = dto.Title;
        gridEvent.Description = dto.Description;
        gridEvent.StartTime = dto.StartTime;
        gridEvent.EndTime = dto.EndTime;
        gridEvent.Status = dto.Status;
        gridEvent.Priority = dto.Priority;
        gridEvent.Location = dto.Location;
        gridEvent.UpdatedAt = DateTime.UtcNow;

        _context.Entry(gridEvent).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!GridEventExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGridEvent(Guid id)
    {
        var gridEvent = await _context.GridEvents.FindAsync(id);
        if (gridEvent == null)
        {
            return NotFound();
        }

        _context.GridEvents.Remove(gridEvent);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool GridEventExists(Guid id)
    {
        return _context.GridEvents.Any(e => e.Id == id);
    }
}
