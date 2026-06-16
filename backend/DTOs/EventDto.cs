
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class EventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }
    public string? LocationAddress { get; set; }
    public int GridId { get; set; }
    public string? GridName { get; set; }
    public int ReporterId { get; set; }
    public string? ReporterName { get; set; }
    public EventStatus Status { get; set; }
    public int Priority { get; set; }
    public string? SourceBillNo { get; set; }
    public string? CloseReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<EventStatusLogDto>? StatusLogs { get; set; }
}

public class EventStatusLogDto
{
    public int Id { get; set; }
    public EventStatus FromStatus { get; set; }
    public EventStatus ToStatus { get; set; }
    public int OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }
    public string? LocationAddress { get; set; }
    public int GridId { get; set; }
    public int Priority { get; set; }
    public string? SourceBillNo { get; set; }
}

public class UpdateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }
    public string? LocationAddress { get; set; }
    public int Priority { get; set; }
    public string? SourceBillNo { get; set; }
}

public class ChangeEventStatusDto
{
    public EventStatus NewStatus { get; set; }
    public string? Remark { get; set; }
    public string? CloseReason { get; set; }
}

public class EventQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public EventStatus? Status { get; set; }
    public EventType? EventType { get; set; }
    public int? GridId { get; set; }
    public string? Keyword { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
}
