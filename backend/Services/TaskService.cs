
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Data;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Services;

public class TaskService : ITaskService
{
    private readonly ApplicationDbContext _context;

    public TaskService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResultDto<PatrolTaskDto>> GetPagedPatrolTasksAsync(PatrolTaskQueryDto query)
    {
        var queryable = _context.PatrolTasks
            .Include(t => t.Grid)
            .Include(t => t.Assignee)
            .Include(t => t.RelatedEvent)
            .AsQueryable();

        if (query.Status.HasValue)
            queryable = queryable.Where(t => t.Status == query.Status.Value);

        if (query.GridId.HasValue)
            queryable = queryable.Where(t => t.GridId == query.GridId.Value);

        if (query.AssigneeId.HasValue)
            queryable = queryable.Where(t => t.AssigneeId == query.AssigneeId.Value);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(t => t.PlanDate >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(t => t.PlanDate <= query.EndDate.Value);

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderByDescending(t => t.PlanDate)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => MapToPatrolTaskDto(t))
            .ToListAsync();

        return new PagedResultDto<PatrolTaskDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<PatrolTaskDto?> GetPatrolTaskByIdAsync(int id)
    {
        var task = await _context.PatrolTasks
            .Include(t => t.Grid)
            .Include(t => t.Assignee)
            .Include(t => t.RelatedEvent)
            .FirstOrDefaultAsync(t => t.Id == id);
        return task == null ? null : MapToPatrolTaskDto(task);
    }

    public async Task<PatrolTaskDto> CreatePatrolTaskAsync(CreatePatrolTaskDto request)
    {
        var task = new PatrolTask
        {
            GridId = request.GridId,
            AssigneeId = request.AssigneeId,
            Title = request.Title,
            PlanDate = request.PlanDate,
            Status = TaskStatus.Pending,
            RelatedEventId = request.RelatedEventId,
            Remark = request.Remark,
            SourceBillNo = request.SourceBillNo
        };

        _context.PatrolTasks.Add(task);
        await _context.SaveChangesAsync();
        return MapToPatrolTaskDto(await _context.PatrolTasks.Include(t => t.Grid).Include(t => t.Assignee).Include(t => t.RelatedEvent).FirstAsync(t => t.Id == task.Id));
    }

    public async Task<PatrolTaskDto?> UpdatePatrolTaskAsync(int id, UpdatePatrolTaskDto request)
    {
        var task = await _context.PatrolTasks.FindAsync(id);
        if (task == null) return null;

        task.GridId = request.GridId;
        task.AssigneeId = request.AssigneeId;
        task.Title = request.Title;
        task.PlanDate = request.PlanDate;
        task.Status = request.Status;
        task.RelatedEventId = request.RelatedEventId;
        task.Remark = request.Remark;
        task.SourceBillNo = request.SourceBillNo;

        await _context.SaveChangesAsync();
        return MapToPatrolTaskDto(await _context.PatrolTasks.Include(t => t.Grid).Include(t => t.Assignee).Include(t => t.RelatedEvent).FirstAsync(t => t.Id == id));
    }

    public async Task<bool> DeletePatrolTaskAsync(int id)
    {
        var task = await _context.PatrolTasks.FindAsync(id);
        if (task == null) return false;

        _context.PatrolTasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ReviewDto?> CreateReviewAsync(CreateReviewDto request, int reviewerId)
    {
        var review = new RectificationReview
        {
            EventId = request.EventId,
            ReviewerId = reviewerId,
            Result = request.Result,
            Remark = request.Remark,
            SourceBillNo = request.SourceBillNo,
            CreatedAt = DateTime.UtcNow
        };

        _context.RectificationReviews.Add(review);
        await _context.SaveChangesAsync();
        return MapToReviewDto(await _context.RectificationReviews.Include(r => r.Event).Include(r => r.Reviewer).FirstAsync(r => r.Id == review.Id));
    }

    public async Task<ReviewDto?> GetReviewByIdAsync(int id)
    {
        var review = await _context.RectificationReviews
            .Include(r => r.Event)
            .Include(r => r.Reviewer)
            .FirstOrDefaultAsync(r => r.Id == id);
        return review == null ? null : MapToReviewDto(review);
    }

    public async Task<List<ReviewDto>> GetReviewsByEventIdAsync(int eventId)
    {
        return await _context.RectificationReviews
            .Where(r => r.EventId == eventId)
            .Include(r => r.Event)
            .Include(r => r.Reviewer)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => MapToReviewDto(r))
            .ToListAsync();
    }

    public async Task<VisitDto?> CreateVisitAsync(CreateVisitDto request)
    {
        var evt = await _context.GridEvents.FindAsync(request.EventId);
        if (evt == null) return null;

        if (evt.Status == EventStatus.FollowingUp)
        {
            var hasPendingFollowUpTodo = await _context.TodoItems
                .AnyAsync(t => t.Type == TodoType.FollowUp
                    && t.RelatedId == request.EventId
                    && !t.IsCompleted);
            if (!hasPendingFollowUpTodo)
            {
                var lastVisit = await _context.FollowUpVisits
                    .Where(v => v.EventId == request.EventId)
                    .OrderByDescending(v => v.VisitDate)
                    .FirstOrDefaultAsync();

                if (lastVisit == null || (DateTime.UtcNow - lastVisit.VisitDate).TotalDays > 3)
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
        }

        var visit = new FollowUpVisit
        {
            EventId = request.EventId,
            VisitorId = request.VisitorId,
            VisitDate = request.VisitDate,
            VisitResult = request.VisitResult,
            VisitorRemark = request.VisitorRemark,
            IsCompleted = request.IsCompleted,
            CreatedAt = DateTime.UtcNow
        };

        _context.FollowUpVisits.Add(visit);

        if (request.IsCompleted)
        {
            var pendingTodos = await _context.TodoItems
                .Where(t => t.Type == TodoType.FollowUp
                    && t.RelatedId == request.EventId
                    && !t.IsCompleted)
                .ToListAsync();

            foreach (var todo in pendingTodos)
            {
                todo.IsCompleted = true;
                todo.CompletedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return MapToVisitDto(await _context.FollowUpVisits.Include(v => v.Event).Include(v => v.Visitor).FirstAsync(v => v.Id == visit.Id));
    }

    public async Task<VisitDto?> GetVisitByIdAsync(int id)
    {
        var visit = await _context.FollowUpVisits
            .Include(v => v.Event)
            .Include(v => v.Visitor)
            .FirstOrDefaultAsync(v => v.Id == id);
        return visit == null ? null : MapToVisitDto(visit);
    }

    public async Task<VisitDto?> UpdateVisitAsync(int id, UpdateVisitDto request)
    {
        var visit = await _context.FollowUpVisits.FindAsync(id);
        if (visit == null) return null;

        visit.VisitorId = request.VisitorId;
        visit.VisitDate = request.VisitDate;
        visit.VisitResult = request.VisitResult;
        visit.VisitorRemark = request.VisitorRemark;
        visit.IsCompleted = request.IsCompleted;

        await _context.SaveChangesAsync();
        return MapToVisitDto(await _context.FollowUpVisits.Include(v => v.Event).Include(v => v.Visitor).FirstAsync(v => v.Id == id));
    }

    public async Task<List<VisitDto>> GetVisitsByEventIdAsync(int eventId)
    {
        return await _context.FollowUpVisits
            .Where(v => v.EventId == eventId)
            .Include(v => v.Event)
            .Include(v => v.Visitor)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => MapToVisitDto(v))
            .ToListAsync();
    }

    public async Task<PagedResultDto<TodoDto>> GetPagedTodosAsync(TodoQueryDto query)
    {
        var queryable = _context.TodoItems
            .Include(t => t.User)
            .AsQueryable();

        if (query.Type.HasValue)
            queryable = queryable.Where(t => t.Type == query.Type.Value);

        if (query.UserId.HasValue)
            queryable = queryable.Where(t => t.UserId == query.UserId.Value);

        if (query.IsCompleted.HasValue)
            queryable = queryable.Where(t => t.IsCompleted == query.IsCompleted.Value);

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderBy(t => t.IsCompleted)
            .ThenByDescending(t => t.DueDate)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => MapToTodoDto(t))
            .ToListAsync();

        return new PagedResultDto<TodoDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<TodoDto?> GetTodoByIdAsync(int id)
    {
        var todo = await _context.TodoItems
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id);
        return todo == null ? null : MapToTodoDto(todo);
    }

    public async Task<TodoDto> CreateTodoAsync(CreateTodoDto request)
    {
        var todo = new TodoItem
        {
            UserId = request.UserId,
            Type = request.Type,
            RelatedId = request.RelatedId,
            Title = request.Title,
            DueDate = request.DueDate,
            IsCompleted = false
        };

        _context.TodoItems.Add(todo);
        await _context.SaveChangesAsync();
        return MapToTodoDto(await _context.TodoItems.Include(t => t.User).FirstAsync(t => t.Id == todo.Id));
    }

    public async Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoDto request)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null) return null;

        todo.Title = request.Title;
        todo.DueDate = request.DueDate;
        todo.IsCompleted = request.IsCompleted;
        if (request.IsCompleted && !todo.CompletedAt.HasValue)
            todo.CompletedAt = DateTime.UtcNow;
        else if (!request.IsCompleted)
            todo.CompletedAt = null;

        await _context.SaveChangesAsync();
        return MapToTodoDto(await _context.TodoItems.Include(t => t.User).FirstAsync(t => t.Id == id));
    }

    public async Task<bool> DeleteTodoAsync(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null) return false;

        _context.TodoItems.Remove(todo);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TodoDto?> CompleteTodoAsync(int id)
    {
        var todo = await _context.TodoItems.FindAsync(id);
        if (todo == null) return null;

        todo.IsCompleted = true;
        todo.CompletedAt = DateTime.UtcNow;

        if (todo.Type == TodoType.FollowUp)
        {
            var visit = new FollowUpVisit
            {
                EventId = todo.RelatedId,
                VisitorId = todo.UserId,
                VisitDate = DateTime.UtcNow,
                IsCompleted = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.FollowUpVisits.Add(visit);
        }

        await _context.SaveChangesAsync();
        return MapToTodoDto(await _context.TodoItems.Include(t => t.User).FirstAsync(t => t.Id == id));
    }

    private static PatrolTaskDto MapToPatrolTaskDto(PatrolTask task)
    {
        return new PatrolTaskDto
        {
            Id = task.Id,
            GridId = task.GridId,
            GridName = task.Grid?.Name,
            AssigneeId = task.AssigneeId,
            AssigneeName = task.Assignee?.RealName ?? task.Assignee?.Username,
            Title = task.Title,
            PlanDate = task.PlanDate,
            Status = task.Status,
            RelatedEventId = task.RelatedEventId,
            RelatedEventTitle = task.RelatedEvent?.Title,
            Remark = task.Remark,
            SourceBillNo = task.SourceBillNo
        };
    }

    private static ReviewDto MapToReviewDto(RectificationReview review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            EventId = review.EventId,
            EventTitle = review.Event?.Title,
            ReviewerId = review.ReviewerId,
            ReviewerName = review.Reviewer?.RealName ?? review.Reviewer?.Username,
            Result = review.Result,
            Remark = review.Remark,
            CreatedAt = review.CreatedAt,
            SourceBillNo = review.SourceBillNo
        };
    }

    private static VisitDto MapToVisitDto(FollowUpVisit visit)
    {
        return new VisitDto
        {
            Id = visit.Id,
            EventId = visit.EventId,
            EventTitle = visit.Event?.Title,
            VisitorId = visit.VisitorId,
            VisitorName = visit.Visitor?.RealName ?? visit.Visitor?.Username,
            VisitDate = visit.VisitDate,
            VisitResult = visit.VisitResult,
            VisitorRemark = visit.VisitorRemark,
            IsCompleted = visit.IsCompleted,
            CreatedAt = visit.CreatedAt
        };
    }

    private static TodoDto MapToTodoDto(TodoItem todo)
    {
        return new TodoDto
        {
            Id = todo.Id,
            UserId = todo.UserId,
            UserName = todo.User?.RealName ?? todo.User?.Username,
            Type = todo.Type,
            RelatedId = todo.RelatedId,
            Title = todo.Title,
            DueDate = todo.DueDate,
            IsCompleted = todo.IsCompleted,
            CompletedAt = todo.CompletedAt
        };
    }
}
