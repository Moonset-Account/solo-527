using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.API.Dtos;

public class BatchMaterialStatusRequest
{
    public List<Guid> Ids { get; set; } = new();
    public MaterialStatus NewStatus { get; set; }
    public Guid OperatorId { get; set; }
    public string? Remark { get; set; }
}
