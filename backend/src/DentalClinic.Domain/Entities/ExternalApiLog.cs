
namespace DentalClinic.Domain.Entities;

public class ExternalApiLog
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
    public DateTime? ResponseTime { get; set; }
    public long? DurationMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<ExternalApiBatchItem> BatchItems { get; set; } = new List<ExternalApiBatchItem>();
}

public class ExternalApiBatchItem
{
    public int Id { get; set; }
    public int ExternalApiLogId { get; set; }
    public string? PatientName { get; set; }
    public string? Phone { get; set; }
    public string? ItemType { get; set; }
    public decimal? Amount { get; set; }
    public string? Status { get; set; }
    public string? Error { get; set; }

    public ExternalApiLog? ExternalApiLog { get; set; }
}
