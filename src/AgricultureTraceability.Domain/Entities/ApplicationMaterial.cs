using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Entities;

public class ApplicationMaterial
{
    public Guid Id { get; set; }
    public string? MaterialType { get; set; }
    public string? MaterialName { get; set; }
    public MaterialStatus Status { get; set; }
    public Guid HarvestBatchId { get; set; }
    public HarvestBatch? HarvestBatch { get; set; }
    public DateTime ApplicationDate { get; set; }
    public decimal Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Applicator { get; set; }
    public string? Remark { get; set; }
    public string? ProcessResult { get; set; }
    public DateTime CreatedAt { get; set; }
}
