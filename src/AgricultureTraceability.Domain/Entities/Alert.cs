using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class Alert
{
    public Guid Id { get; set; }
    public string? ParameterType { get; set; }
    public AlertLevel Level { get; set; }
    public AlertStatus Status { get; set; }
    public Guid PlotId { get; set; }
    public Plot? Plot { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal ThresholdValue { get; set; }
    public string? Message { get; set; }
    public DateTime TriggeredAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public Guid? AcknowledgedBy { get; set; }
}
