
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardReportDto> GetDashboardReportAsync(ReportQueryDto query)
    {
        var eventsQuery = _context.GridEvents.AsQueryable();
        var tasksQuery = _context.PatrolTasks.AsQueryable();

        if (query.GridId.HasValue)
        {
            eventsQuery = eventsQuery.Where(e => e.GridId == query.GridId.Value);
            tasksQuery = tasksQuery.Where(t => t.GridId == query.GridId.Value);
        }

        if (query.StartDate.HasValue)
        {
            eventsQuery = eventsQuery.Where(e => e.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            eventsQuery = eventsQuery.Where(e => e.CreatedAt <= query.EndDate.Value);
        }

        var totalEvents = await eventsQuery.CountAsync();
        var closedEvents = await eventsQuery.CountAsync(e => e.Status == EventStatus.Closed || e.Status == EventStatus.AbnormalClosed);
        var processingEvents = await eventsQuery.CountAsync(e => e.Status == EventStatus.Processing || e.Status == EventStatus.Reviewing || e.Status == EventStatus.FollowingUp);
        var pendingEvents = await eventsQuery.CountAsync(e => e.Status == EventStatus.Reported || e.Status == EventStatus.Assigned);

        var totalPatrolTasks = await tasksQuery.CountAsync();
        var completedPatrolTasks = await tasksQuery.CountAsync(t => t.Status == TaskStatus.Completed);
        var pendingPatrolTasks = await tasksQuery.CountAsync(t => t.Status == TaskStatus.Pending || t.Status == TaskStatus.InProgress);

        var residentQuery = _context.Residents.AsQueryable();
        if (query.GridId.HasValue)
            residentQuery = residentQuery.Where(r => r.GridId == query.GridId.Value);

        var userQuery = _context.Users.AsQueryable();
        if (query.GridId.HasValue)
            userQuery = userQuery.Where(u => u.GridId == query.GridId.Value);

        var pendingTodos = await _context.TodoItems
            .Where(t => !t.IsCompleted)
            .CountAsync();

        return new DashboardReportDto
        {
            TotalEvents = totalEvents,
            ClosedEvents = closedEvents,
            ProcessingEvents = processingEvents,
            PendingEvents = pendingEvents,
            CloseRate = totalEvents > 0 ? Math.Round((double)closedEvents / totalEvents * 100, 2) : 0,
            TotalPatrolTasks = totalPatrolTasks,
            CompletedPatrolTasks = completedPatrolTasks,
            PendingPatrolTasks = pendingPatrolTasks,
            TotalResidents = await residentQuery.CountAsync(),
            TotalUsers = await userQuery.CountAsync(),
            PendingTodos = pendingTodos
        };
    }

    public async Task<List<EventStatusReportDto>> GetEventStatusReportAsync(ReportQueryDto query)
    {
        var queryable = _context.GridEvents.AsQueryable();
        if (query.GridId.HasValue)
            queryable = queryable.Where(e => e.GridId == query.GridId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt <= query.EndDate.Value);

        var total = await queryable.CountAsync();
        var statusList = Enum.GetValues(typeof(EventStatus)).Cast<EventStatus>();

        var result = new List<EventStatusReportDto>();
        foreach (var status in statusList)
        {
            var count = await queryable.CountAsync(e => e.Status == status);
            result.Add(new EventStatusReportDto
            {
                Status = status,
                StatusName = status.ToString(),
                Count = count,
                Percentage = total > 0 ? Math.Round((double)count / total * 100, 2) : 0
            });
        }

        return result;
    }

    public async Task<List<EventTypeReportDto>> GetEventTypeReportAsync(ReportQueryDto query)
    {
        var queryable = _context.GridEvents.AsQueryable();
        if (query.GridId.HasValue)
            queryable = queryable.Where(e => e.GridId == query.GridId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt <= query.EndDate.Value);

        var total = await queryable.CountAsync();
        var typeList = Enum.GetValues(typeof(EventType)).Cast<EventType>();

        var result = new List<EventTypeReportDto>();
        foreach (var type in typeList)
        {
            var count = await queryable.CountAsync(e => e.EventType == type);
            result.Add(new EventTypeReportDto
            {
                EventType = type,
                EventTypeName = type.ToString(),
                Count = count,
                Percentage = total > 0 ? Math.Round((double)count / total * 100, 2) : 0
            });
        }

        return result;
    }

    public async Task<List<GridReportDto>> GetGridReportAsync(ReportQueryDto query)
    {
        var grids = await _context.Grids
            .Include(g => g.Events)
            .Include(g => g.Residents)
            .ToListAsync();

        var result = new List<GridReportDto>();
        foreach (var grid in grids)
        {
            var events = grid.Events.AsQueryable();
            if (query.StartDate.HasValue)
                events = events.Where(e => e.CreatedAt >= query.StartDate.Value);
            if (query.EndDate.HasValue)
                events = events.Where(e => e.CreatedAt <= query.EndDate.Value);

            var totalEvents = events.Count();
            var closedEvents = events.Count(e => e.Status == EventStatus.Closed || e.Status == EventStatus.AbnormalClosed);
            var processingEvents = events.Count(e => e.Status == EventStatus.Processing || e.Status == EventStatus.Reviewing || e.Status == EventStatus.FollowingUp);

            result.Add(new GridReportDto
            {
                GridId = grid.Id,
                GridName = grid.Name,
                TotalEvents = totalEvents,
                ClosedEvents = closedEvents,
                ProcessingEvents = processingEvents,
                CloseRate = totalEvents > 0 ? Math.Round((double)closedEvents / totalEvents * 100, 2) : 0,
                ResidentCount = grid.Residents.Count
            });
        }

        return result.OrderByDescending(r => r.TotalEvents).ToList();
    }

    public async Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync(ReportQueryDto query)
    {
        var startDate = query.StartDate ?? DateTime.UtcNow.AddMonths(-11);
        var endDate = query.EndDate ?? DateTime.UtcNow;

        var events = await _context.GridEvents
            .Where(e => e.CreatedAt >= startDate && e.CreatedAt <= endDate && (!query.GridId.HasValue || e.GridId == query.GridId.Value))
            .ToListAsync();

        var result = new List<MonthlyTrendDto>();
        var current = new DateTime(startDate.Year, startDate.Month, 1);
        while (current <= endDate)
        {
            var monthEvents = events.Where(e => e.CreatedAt.Year == current.Year && e.CreatedAt.Month == current.Month).ToList();
            var newEvents = monthEvents.Count;
            var closedEvents = monthEvents.Count(e => e.Status == EventStatus.Closed || e.Status == EventStatus.AbnormalClosed);

            result.Add(new MonthlyTrendDto
            {
                Year = current.Year,
                Month = current.Month,
                NewEvents = newEvents,
                ClosedEvents = closedEvents
            });

            current = current.AddMonths(1);
        }

        return result;
    }

    public async Task<ClosureReportDto> GetClosureReportAsync(ReportQueryDto query)
    {
        var queryable = _context.GridEvents.AsQueryable();
        if (query.GridId.HasValue)
            queryable = queryable.Where(e => e.GridId == query.GridId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(e => e.CreatedAt <= query.EndDate.Value);

        var totalEvents = await queryable.CountAsync();
        var normalClosed = await queryable.CountAsync(e => e.Status == EventStatus.Closed);
        var abnormalClosed = await queryable.CountAsync(e => e.Status == EventStatus.AbnormalClosed);
        var openEvents = totalEvents - normalClosed - abnormalClosed;

        var closedEvents = await queryable
            .Where(e => e.Status == EventStatus.Closed || e.Status == EventStatus.AbnormalClosed)
            .Include(e => e.StatusLogs)
            .ToListAsync();

        double avgHours = 0;
        if (closedEvents.Any())
        {
            var totalHours = closedEvents.Sum(e =>
            {
                var firstLog = e.StatusLogs.OrderBy(l => l.CreatedAt).FirstOrDefault();
                var lastLog = e.StatusLogs.OrderByDescending(l => l.CreatedAt).FirstOrDefault();
                if (firstLog != null && lastLog != null)
                    return (lastLog.CreatedAt - firstLog.CreatedAt).TotalHours;
                return 0;
            });
            avgHours = Math.Round(totalHours / closedEvents.Count, 2);
        }

        var todoQuery = _context.TodoItems.AsQueryable();
        if (query.GridId.HasValue)
            todoQuery = todoQuery.Where(t => t.User.GridId == query.GridId.Value);

        var pendingVisitCount = await todoQuery
            .Where(t => t.Type == TodoType.FollowUp && !t.IsCompleted)
            .CountAsync();

        return new ClosureReportDto
        {
            TotalEvents = totalEvents,
            NormalClosed = normalClosed,
            AbnormalClosed = abnormalClosed,
            OpenEvents = openEvents,
            NormalCloseRate = totalEvents > 0 ? Math.Round((double)normalClosed / totalEvents * 100, 2) : 0,
            OverallCloseRate = totalEvents > 0 ? Math.Round((double)(normalClosed + abnormalClosed) / totalEvents * 100, 2) : 0,
            AvgProcessingHours = avgHours,
            PendingVisitCount = pendingVisitCount,
            PendingVisitRate = totalEvents > 0 ? Math.Round((double)pendingVisitCount / totalEvents * 100, 2) : 0
        };
    }
}
