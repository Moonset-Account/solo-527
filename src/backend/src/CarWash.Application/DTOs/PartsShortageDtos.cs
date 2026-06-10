namespace CarWash.Application.DTOs;

public class PartsShortageDto
{
    public Guid Id { get; set; }
    public string PartName { get; set; } = string.Empty;
    public List<string> AffectedServices { get; set; } = new();
    public List<Guid> AffectedWorkstationIds { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime? EstimatedArrival { get; set; }
    public DateTime ReportedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<PartsShortageNodeDto> Nodes { get; set; } = new();
}

public class PartsShortageNodeDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
}

public class CreatePartsShortageRequest
{
    public string PartName { get; set; } = string.Empty;
    public List<string> AffectedServices { get; set; } = new();
    public List<Guid> AffectedWorkstationIds { get; set; } = new();
    public DateTime? EstimatedArrival { get; set; }
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdatePartsShortageStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public Guid OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? EstimatedArrival { get; set; }
}
