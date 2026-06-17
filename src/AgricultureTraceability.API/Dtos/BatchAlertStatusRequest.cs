using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.API.Dtos;

public class BatchAlertStatusRequest
{
    public List<Guid> Ids { get; set; } = new();
    public AlertStatus NewStatus { get; set; }
    public Guid OperatorId { get; set; }
}
