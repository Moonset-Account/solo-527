using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class HarvestBatch
{
    public Guid Id { get; set; }
    public string? BatchNumber { get; set; }
    public string? QrCode { get; set; }
    public BatchStatus Status { get; set; }
    public Guid PlotId { get; set; }
    public Plot? Plot { get; set; }
    public Guid VarietyId { get; set; }
    public Variety? Variety { get; set; }
    public DateTime PlantingDate { get; set; }
    public DateTime? HarvestDate { get; set; }
    public decimal ExpectedYield { get; set; }
    public decimal ActualYield { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}
