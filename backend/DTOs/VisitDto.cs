
namespace GridEventManagement.Web.DTOs;

public class VisitDto
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string? EventTitle { get; set; }
    public int VisitorId { get; set; }
    public string? VisitorName { get; set; }
    public DateTime VisitDate { get; set; }
    public string? VisitResult { get; set; }
    public string? VisitorRemark { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVisitDto
{
    public int EventId { get; set; }
    public int VisitorId { get; set; }
    public DateTime VisitDate { get; set; }
    public string? VisitResult { get; set; }
    public string? VisitorRemark { get; set; }
    public bool IsCompleted { get; set; }
}

public class UpdateVisitDto
{
    public int VisitorId { get; set; }
    public DateTime VisitDate { get; set; }
    public string? VisitResult { get; set; }
    public string? VisitorRemark { get; set; }
    public bool IsCompleted { get; set; }
}
