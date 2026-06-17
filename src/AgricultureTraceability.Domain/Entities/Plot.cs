namespace AgricultureTraceability.Domain.Entities;

public class Plot
{
    public Guid Id { get; set; }
    public string? PlotCode { get; set; }
    public string? Name { get; set; }
    public decimal Area { get; set; }
    public string? Location { get; set; }
    public string? GreenhouseName { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
