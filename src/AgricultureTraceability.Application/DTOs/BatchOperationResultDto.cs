namespace AgricultureTraceability.Application.DTOs;

public class BatchOperationResultDto
{
    public Guid BatchOperationId { get; set; }
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Summary { get; set; } = string.Empty;
    public List<BatchOperationItemResultDto> Items { get; set; } = new();
}

public class BatchOperationItemResultDto
{
    public Guid? EntityId { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
