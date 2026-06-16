
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface ITodoItemService
{
    Task<PagedResultDto<TodoItemDto>> GetListAsync(TodoQueryDto query);
    Task<TodoItemDto?> GetByIdAsync(int id, bool includeDetails = false);
    Task<TodoItemDto> CreateAsync(TodoItemCreateDto dto);
    Task<TodoItemDto?> UpdateAsync(int id, TodoItemUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> CompleteAsync(int id);
    Task<int> GetPendingCountAsync(int? assignedToUserId = null);
}
