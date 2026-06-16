
using GridEventManagement.Web.Enums;

namespace GridEventManagement.Web.DTOs;

public class PatrolTaskDto
{
    public int Id { get; set; }
    public int GridId { get; set; }
    public string? GridName { get; set; }
    public int AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public TaskStatus Status { get; set; }
    public int? RelatedEventId { get; set; }
    public string? RelatedEventTitle { get; set; }
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }
}

public class CreatePatrolTaskDto
{
    public int GridId { get; set; }
    public int AssigneeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public int? RelatedEventId { get; set; }
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }
}

public class UpdatePatrolTaskDto
{
    public int GridId { get; set; }
    public int AssigneeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime PlanDate { get; set; }
    public TaskStatus Status { get; set; }
    public int? RelatedEventId { get; set; }
    public string? Remark { get; set; }
    public string? SourceBillNo { get; set; }
}

public class PatrolTaskQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public TaskStatus? Status { get; set; }
    public int? GridId { get; set; }
    public int? AssigneeId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
