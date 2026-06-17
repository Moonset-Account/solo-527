using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.API.Dtos;

public class BatchOrderStatusRequest
{
    public List<Guid> Ids { get; set; } = new();
    public OrderStatus NewStatus { get; set; }
    public Guid OperatorId { get; set; }
}
