
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface ITodoItemService
{
    Task&lt;PagedResultDto&lt;TodoItemDto&gt;&gt; GetListAsync(TodoQueryDto query);
    Task&lt;TodoItemDto?&gt; GetByIdAsync(int id, bool includeDetails = false);
    Task&lt;TodoItemDto&gt; CreateAsync(TodoItemCreateDto dto);
    Task&lt;TodoItemDto?&gt; UpdateAsync(int id, TodoItemUpdateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
    Task&lt;bool&gt; CompleteAsync(int id);
    Task&lt;int&gt; GetPendingCountAsync(int? assignedToUserId = null);
}
