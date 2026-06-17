using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Dtos;

public class BatchFilterDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public string? BatchNumber { get; set; }
    public Guid? PlotId { get; set; }
    public Guid? VarietyId { get; set; }
    public BatchStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
