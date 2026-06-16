
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.Services;

public interface IEventService
{
    Task<PagedResultDto<EventDto>> GetPagedEventsAsync(EventQueryDto query);
    Task<EventDto?> GetEventByIdAsync(int id);
    Task<EventDto> CreateEventAsync(CreateEventDto request, int reporterId);
    Task<EventDto?> UpdateEventAsync(int id, UpdateEventDto request);
    Task<EventDto?> ChangeEventStatusAsync(int id, ChangeEventStatusDto request, int operatorId);
    Task<bool> DeleteEventAsync(int id);
    Task<List<EventStatusLogDto>> GetEventStatusLogsAsync(int eventId);
}
