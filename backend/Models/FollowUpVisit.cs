
namespace GridEventManagement.Web.Models;

public class FollowUpVisit
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int VisitorId { get; set; }
    public DateTime VisitDate { get; set; }
    public string? VisitResult { get; set; }
    public string? VisitorRemark { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }

    public GridEvent Event { get; set; } = null!;
    public User Visitor { get; set; } = null!;
}
