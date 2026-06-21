using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class WorkReportAudit : BaseEntity
{
    public Guid WorkReportId { get; set; }
    public WorkReportStatus PreviousStatus { get; set; }
    public WorkReportStatus NewStatus { get; set; }
    public Guid ReviewerId { get; set; }
    public string? Comment { get; set; }
    public WorkReport WorkReport { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}
