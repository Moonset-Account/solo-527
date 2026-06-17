namespace AgricultureTraceability.Domain.Entities;

public class Threshold
{
    public Guid Id { get; set; }
    public string? ParameterType { get; set; }
    public Guid? PlotId { get; set; }
    public Plot? Plot { get; set; }
    public decimal MinValue { get; set; }
    public decimal MaxValue { get; set; }
    public DateTime CreatedAt { get; set; }
}
