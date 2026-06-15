
namespace PrintingFactory.Domain.Entities;

public class ProductionNode
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<ProductionProgress> ProductionProgresses { get; set; } = new List<ProductionProgress>();
}
