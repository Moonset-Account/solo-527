
namespace DentalClinic.Application.DTOs;

public class ExternalApiLogDto
{
    public int Id { get; set; }
    public string ApiName { get; set; } = string.Empty;
    public string? BatchId { get; set; }
    public string RequestUrl { get; set; } = string.Empty;
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
    public int? StatusCode { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorType { get; set; }
    public string? Suggestion { get; set; }
    public int RetryCount { get; set; }
    public bool CanRetry { get; set; }
    public DateTime RequestTime { get; set; }
    public string? RequestTimeText { get; set; }
    public DateTime? ResponseTime { get; set; }
    public long? DurationMs { get; set; }
    public List<ExternalApiBatchItemDto>? BatchItems { get; set; }
}

public class ExternalApiBatchItemDto
{
    public int Id { get; set; }
    public string? PatientName { get; set; }
    public string? Phone { get; set; }
    public string? ItemType { get; set; }
    public decimal? Amount { get; set; }
    public string? Status { get; set; }
    public string? Error { get; set; }
}

public class ExternalApiLogQueryDto : PagedQueryDto
{
    public string? ApiName { get; set; }
    public string? BatchId { get; set; }
    public bool? IsSuccess { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}

public class ApiFailureSummaryDto
{
    public string ApiName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int FailureCount { get; set; }
    public decimal FailureRate { get; set; }
    public List<FailureTypeGroupDto> FailureTypes { get; set; } = new();
}

public class FailureTypeGroupDto
{
    public string ErrorType { get; set; } = string.Empty;
    public int Count { get; set; }
    public string? MostCommonSuggestion { get; set; }
}
