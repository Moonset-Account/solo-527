using GridEventManagement.Enums;

namespace GridEventManagement.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? GridId { get; set; }
    public string? RealName { get; set; }
    public string? Phone { get; set; }

    public Grid? Grid { get; set; }
    public ICollection<GridEvent> ReportedEvents { get; set; } = new List<GridEvent>();
    public ICollection<PatrolTask> AssignedPatrolTasks { get; set; } = new List<PatrolTask>();
    public ICollection<EventStatusLog> StatusLogs { get; set; } = new List<EventStatusLog>();
    public ICollection<RectificationReview> Reviews { get; set; } = new List<RectificationReview>();
    public ICollection<FollowUpVisit> Visits { get; set; } = new List<FollowUpVisit>();
    public ICollection<TodoItem> TodoItems { get; set; } = new List<TodoItem>();
}
