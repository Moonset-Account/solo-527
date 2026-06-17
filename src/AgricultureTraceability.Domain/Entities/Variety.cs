namespace AgricultureTraceability.Domain.Entities;

public class Variety
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Category { get; set; }
    public int GrowthDays { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
