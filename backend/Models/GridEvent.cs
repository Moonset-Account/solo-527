
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.Models;

public class GridEvent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }
    public string? LocationAddress { get; set; }
    public int GridId { get; set; }
    public int ReporterId { get; set; }
    public EventStatus Status { get; set; }
    public int Priority { get; set; }
    public string? SourceBillNo { get; set; }
    public string? CloseReason { get; set; }
    public DateTime CreatedAt { get; set; }

    public Grid Grid { get; set; } = null!;
    public User Reporter { get; set; } = null!;
    public ICollection<EventStatusLog> StatusLogs { get; set; } = new List<EventStatusLog>();
    public ICollection<PatrolTask> RelatedPatrolTasks { get; set; } = new List<PatrolTask>();
    public ICollection<RectificationReview> Reviews { get; set; } = new List<RectificationReview>();
    public ICollection<FollowUpVisit> Visits { get; set; } = new List<FollowUpVisit>();
}
