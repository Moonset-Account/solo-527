namespace ProcessScheduling.Domain.Entities;

public class QCResultHistory : BaseEntity
{
    public Guid QCResultId { get; set; }
    public string PreviousResult { get; set; } = string.Empty;
    public string NewResult { get; set; } = string.Empty;
    public string? ChangeReason { get; set; }
    public QCResult QCResult { get; set; } = null!;
}
