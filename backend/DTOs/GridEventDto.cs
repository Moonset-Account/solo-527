
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class GridEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EventStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public string? Location { get; set; }
}

public class CreateGridEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Pending;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Medium;
    public string? Location { get; set; }
}

public class UpdateGridEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EventStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public string? Location { get; set; }
}
