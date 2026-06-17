namespace AgricultureTraceability.Domain.Dtos;

public class MaterialStatsDto
{
    public int TotalCount { get; set; }
    public int MissingCount { get; set; }
    public int SubmittedCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
}
