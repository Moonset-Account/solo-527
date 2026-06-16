
using GridEventManagement.Web.DTOs;

namespace GridEventManagement.Web.Services;

public interface ITaskService
{
    Task<PagedResultDto<PatrolTaskDto>> GetPagedPatrolTasksAsync(PatrolTaskQueryDto query);
    Task<PatrolTaskDto?> GetPatrolTaskByIdAsync(int id);
    Task<PatrolTaskDto> CreatePatrolTaskAsync(CreatePatrolTaskDto request);
    Task<PatrolTaskDto?> UpdatePatrolTaskAsync(int id, UpdatePatrolTaskDto request);
    Task<bool> DeletePatrolTaskAsync(int id);

    Task<ReviewDto?> CreateReviewAsync(CreateReviewDto request, int reviewerId);
    Task<ReviewDto?> GetReviewByIdAsync(int id);
    Task<List<ReviewDto>> GetReviewsByEventIdAsync(int eventId);

    Task<VisitDto?> CreateVisitAsync(CreateVisitDto request);
    Task<VisitDto?> GetVisitByIdAsync(int id);
    Task<VisitDto?> UpdateVisitAsync(int id, UpdateVisitDto request);
    Task<List<VisitDto>> GetVisitsByEventIdAsync(int eventId);

    Task<PagedResultDto<TodoDto>> GetPagedTodosAsync(TodoQueryDto query);
    Task<TodoDto?> GetTodoByIdAsync(int id);
    Task<TodoDto> CreateTodoAsync(CreateTodoDto request);
    Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoDto request);
    Task<bool> DeleteTodoAsync(int id);
    Task<TodoDto?> CompleteTodoAsync(int id);
}
