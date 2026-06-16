
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.Models;

public class PatrolTask
{
    public int Id { get; set; }
    public int GridId { get; set; }
    public int AssigneeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public TaskStatus Status { get; set; }
    public int? RelatedEventId { get; set; }
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }

    public Grid Grid { get; set; } = null!;
    public User Assignee { get; set; } = null!;
    public GridEvent? RelatedEvent { get; set; }
}
