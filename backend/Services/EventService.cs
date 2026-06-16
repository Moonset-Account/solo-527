
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Services;

public class EventService : IEventService
{
    private readonly ApplicationDbContext _context;

    public EventService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<EventDto>> GetPagedEventsAsync(EventQueryDto query)
    {
        var queryable = _context.GridEvents
            .Include(e => e.Grid)
            .Include(e => e.Reporter)
            .AsQueryable();

        if (query.Status.HasValue)
            queryable = queryable.Where(e => e.Status == query.Status.Value);

        if (query.EventType.HasValue)
            queryable = queryable.Where(e => e.EventType == query.EventType.Value);

        if (query.GridId.HasValue)
            queryable = queryable.Where(e => e.GridId == query.GridId.Value);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
            queryable = queryable.Where(e => e.Title.Contains(query.Keyword) || (e.Description != null && e.Description.Contains(query.Keyword)));

        if (query.StartDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => MapToEventDto(e))
            .ToListAsync();

        return new PagedResultDto<EventDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<EventDto?> GetEventByIdAsync(int id)
    {
        var evt = await _context.GridEvents
            .Include(e => e.Grid)
            .Include(e => e.Reporter)
            .Include(e => e.StatusLogs)
                .ThenInclude(l => l.Operator)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (evt == null) return null;

        var dto = MapToEventDto(evt);
        dto.StatusLogs = evt.StatusLogs
            .OrderBy(l => l.CreatedAt)
            .Select(l => new EventStatusLogDto
            {
                Id = l.Id,
                FromStatus = l.FromStatus,
                ToStatus = l.ToStatus,
                OperatorId = l.OperatorId,
                OperatorName = l.Operator.RealName ?? l.Operator.Username,
                Remark = l.Remark,
                CreatedAt = l.CreatedAt
            })
            .ToList();

        return dto;
    }

    public async Task<EventDto> CreateEventAsync(CreateEventDto request, int reporterId)
    {
        var evt = new GridEvent
        {
            Title = request.Title,
            Description = request.Description,
            EventType = request.EventType,
            LocationLat = request.LocationLat,
            LocationLng = request.LocationLng,
            LocationAddress = request.LocationAddress,
            GridId = request.GridId,
            ReporterId = reporterId,
            Status = EventStatus.Reported,
            Priority = request.Priority,
            SourceBillNo = request.SourceBillNo,
            CreatedAt = DateTime.UtcNow
        };

        _context.GridEvents.Add(evt);

        var statusLog = new EventStatusLog
        {
            Event = evt,
            FromStatus = EventStatus.Reported,
            ToStatus = EventStatus.Reported,
            OperatorId = reporterId,
            Remark = "事件上报",
            CreatedAt = DateTime.UtcNow
        };
        _context.EventStatusLogs.Add(statusLog);

        await _context.SaveChangesAsync();
        return MapToEventDto(await _context.GridEvents.Include(e => e.Grid).Include(e => e.Reporter).FirstAsync(e => e.Id == evt.Id));
    }

    public async Task<EventDto?> UpdateEventAsync(int id, UpdateEventDto request)
    {
        var evt = await _context.GridEvents.FindAsync(id);
        if (evt == null) return null;

        evt.Title = request.Title;
        evt.Description = request.Description;
        evt.EventType = request.EventType;
        evt.LocationLat = request.LocationLat;
        evt.LocationLng = request.LocationLng;
        evt.LocationAddress = request.LocationAddress;
        evt.Priority = request.Priority;
        evt.SourceBillNo = request.SourceBillNo;

        await _context.SaveChangesAsync();
        return MapToEventDto(await _context.GridEvents.Include(e => e.Grid).Include(e => e.Reporter).FirstAsync(e => e.Id == id));
    }

    public async Task<EventDto?> ChangeEventStatusAsync(int id, ChangeEventStatusDto request, int operatorId)
    {
        var evt = await _context.GridEvents.FindAsync(id);
        if (evt == null) return null;

        var oldStatus = evt.Status;
        evt.Status = request.NewStatus;

        if (request.NewStatus == EventStatus.Closed || request.NewStatus == EventStatus.AbnormalClosed)
        {
            evt.CloseReason = request.CloseReason;
        }

        if (request.NewStatus == EventStatus.FollowingUp)
        {
            var hasPendingFollowUpTodo = await _context.TodoItems
                .AnyAsync(t => t.Type == TodoType.FollowUp
                    && t.RelatedId == id
                    && !t.IsCompleted);
            if (!hasPendingFollowUpTodo)
            {
                var todo = new TodoItem
                {
                    UserId = evt.ReporterId,
                    Type = TodoType.FollowUp,
                    RelatedId = evt.Id,
                    Title = $"回访待办：{evt.Title}",
                    DueDate = DateTime.UtcNow.AddDays(3),
                    IsCompleted = false
                };
                _context.TodoItems.Add(todo);
            }
        }

        var statusLog = new EventStatusLog
        {
            EventId = id,
            FromStatus = oldStatus,
            ToStatus = request.NewStatus,
            OperatorId = operatorId,
            Remark = request.Remark,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventStatusLogs.Add(statusLog);

        await _context.SaveChangesAsync();
        return MapToEventDto(await _context.GridEvents.Include(e => e.Grid).Include(e => e.Reporter).FirstAsync(e => e.Id == id));
    }

    public async Task<bool> DeleteEventAsync(int id)
    {
        var evt = await _context.GridEvents.FindAsync(id);
        if (evt == null) return false;

        _context.GridEvents.Remove(evt);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<EventStatusLogDto>> GetEventStatusLogsAsync(int eventId)
    {
        return await _context.EventStatusLogs
            .Where(l => l.EventId == eventId)
            .Include(l => l.Operator)
            .OrderBy(l => l.CreatedAt)
            .Select(l => new EventStatusLogDto
            {
                Id = l.Id,
                FromStatus = l.FromStatus,
                ToStatus = l.ToStatus,
                OperatorId = l.OperatorId,
                OperatorName = l.Operator.RealName ?? l.Operator.Username,
                Remark = l.Remark,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();
    }

    private static EventDto MapToEventDto(GridEvent evt)
    {
        return new EventDto
        {
            Id = evt.Id,
            Title = evt.Title,
            Description = evt.Description,
            EventType = evt.EventType,
            LocationLat = evt.LocationLat,
            LocationLng = evt.LocationLng,
            LocationAddress = evt.LocationAddress,
            GridId = evt.GridId,
            GridName = evt.Grid?.Name,
            ReporterId = evt.ReporterId,
            ReporterName = evt.Reporter?.RealName ?? evt.Reporter?.Username,
            Status = evt.Status,
            Priority = evt.Priority,
            SourceBillNo = evt.SourceBillNo,
            CloseReason = evt.CloseReason,
            CreatedAt = evt.CreatedAt
        };
    }
}
