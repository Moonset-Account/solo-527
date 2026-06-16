using GridEventManagement.Enums;

namespace GridEventManagement.Models;

public class EventStatusLog
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public EventStatus FromStatus { get; set; }
    public EventStatus ToStatus { get; set; }
    public int OperatorId { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }

    public GridEvent Event { get; set; } = null!;
    public User Operator { get; set; } = null!;
}
